/**
 * dsh-argon fusion rules: aligned with the dsh-unrestricted 0.2.4
 * architecture while dynamically loading Argon personality.md
 * and skills from disk on every assembly / preview (true hot-reload).
 *
 * Fusion strategy — INSERT-ONLY. This is deliberate so that dsh-argon
 * coexists cleanly with dsh-unrestricted (which fuses an execution-mode block
 * on top of the SAME prompts). dsh-unrestricted verifies several sections with
 * EXACT-MATCH anchors (`harness:identity`, `deployment:persona-prefix`,
 * `tools:ptc-only`). If we rewrote those sections its anchor check would fail
 * ("preset persona changed") and it would refuse to fuse. So Argon only
 * ever INSERTS its own `argon:rules` block directly behind the persona
 * (or behind dsh-unrestricted's `unrestricted:execution-mode` when present),
 * and never mutates any other section's text.
 *
 * Minimal is the one exception: the registry restores the complete persona after
 * the waterfall, so Argon rebuilds `deployment:persona-prefix` at agent scope.
 * That shadow hardcodes the official minimal persona and structured-output
 * instruction, so `minimalAnchorIssues()` verifies both before the shadow is
 * registered; a mismatch keeps the stock prompt instead of overwriting it.
 *
 * @module dsh-argon/rules
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = join(__dirname, '..', 'assets')

export function loadAsset(relPath) {
  try {
    return readFileSync(join(ASSETS_DIR, relPath), 'utf8')
  } catch (err) {
    console.error(`[dsh-argon] Failed to load asset ${relPath}:`, err)
    return ''
  }
}

/** Persona anchors — used only for MINIMAL's complete-persona shadow, never for rewriting. */
export const ANCHORS = {
  identity: 'You are an AI agent powered by DeepSeek Harness.',
  personaStandard: 'You are a coding agent powered by the {{model}} model.',
  personaMinimal: 'You are a helpful software engineer assistant.',
  planPrefix: 'You are in plan mode. Stay in plan mode until ',
  ptcOnly: '`run_code` is the only tool you can call directly — a tool call naming any other tool fails. Reach every tool the SDK declares below from inside the program.',
  structuredOutputPrefix: 'When you have your final answer, you MUST report it by calling the `structured_output` tool',
  structuredOutputFull: 'When you have your final answer, you MUST report it by calling the `structured_output` tool with arguments matching its parameter schema exactly. Do not finish with a plain text answer: only the tool call counts as your result.',
}

/** Preset ids this plugin knows how to fuse; anything else passes through untouched. */
export const PRESETS = ['standard', 'ptc', 'cordis', 'minimal']

/** Per-preset shape. We only need to know it is a known preset; insertion is uniform. */
export const PRESET_RULES = {
  standard: { persona: 'personaStandard', plan: true, ptcOnly: false, identity: true },
  ptc: { persona: 'personaStandard', plan: true, ptcOnly: true, identity: true },
  cordis: { persona: 'personaStandard', plan: true, ptcOnly: false, identity: true },
  minimal: { persona: 'personaMinimal', plan: false, ptcOnly: false, identity: false },
}

/** Section the fusion adds; sits directly behind the persona (or behind dsh-unrestricted's block). */
export const BLOCK_SECTION = 'argon:rules'

/**
 * 动态组装出完整的 Argon 核心注入指令块（每次调用动态读取磁盘最新文件，实现真正热更新）
 */
export function buildArgonPromptBlock() {
  const systemMd = loadAsset('system.md')
  const personalityMd = loadAsset('personality.md')

  const filled = systemMd.replace('{{agent_personality}}', personalityMd.trim())

  return `
## 【Argon 模式 · 虚构文学执笔】

${filled.trim()}
`.trim()
}

/**
 * The fused minimal prompt: the persona sentence followed by the Argon
 * block, plus optional structured-output guidance when a structured subagent
 * runs under minimal. Used ONLY for the minimal preset's complete-persona
 * shadow (the registry restores the complete persona AFTER the waterfall, so a
 * waterfall insert cannot reach it).
 * @param {string} [structuredText] - optional original `tool:structured_output` section text.
 */
export function fusedMinimalPrompt(structuredText = '') {
  const promptBlock = buildArgonPromptBlock()
  const base = ANCHORS.personaMinimal + '\n\n' + promptBlock
  const trimmed = structuredText.trim()
  if (trimmed === '') return base
  return base + '\n\n' + trimmed
}

/**
 * Verify the anchors that the minimal complete-persona shadow hardcodes.
 * Standard/PTC/Cordis stay INSERT-ONLY and need no anchor check; minimal
 * replaces the official persona, so a DSH drift must keep the stock prompt.
 * @param sections - assembled sections of the minimal preset.
 * @returns issue strings; empty when the hardcoded persona and structured text still match.
 */
export function minimalAnchorIssues(sections) {
  const issues = []
  const persona = sections.find(section => section.name === 'deployment:persona-prefix')
  if (persona === undefined || persona.text !== ANCHORS.personaMinimal) {
    issues.push('preset persona changed')
  }
  const structured = sections.find(section => section.name === 'tool:structured_output')
  if (structured !== undefined && structured.text.trim() !== '' && !structured.text.startsWith(ANCHORS.structuredOutputPrefix)) {
    issues.push('structured-output instruction changed')
  }
  return issues
}

/**
 * Contract fingerprint: the first 16 hex digits of SHA-256 over the current
 * Argon prompt block bytes. Editing any asset on disk changes it.
 * @returns lowercase hex digest prefix of buildArgonPromptBlock().
 */
export function contractFingerprint() {
  const block = buildArgonPromptBlock()
  return createHash('sha256').update(block, 'utf8').digest('hex').slice(0, 16)
}

/** The exact bytes this plugin inserts (used by preview and checks). */
export function contractAdditions() {
  return {
    block: buildArgonPromptBlock(),
  }
}

/**
 * Fill the variable slots a preview cannot resolve, then hand the assembly to
 * the caller's renderer.
 *
 * @param assembly - a PromptAssembly-shaped value ({ sections, variables, ... }).
 * @param render - the harness renderer, `(assembly) => string`.
 * @returns the rendered prompt text with unbound variables left literal.
 */
export function renderPreview(assembly, render) {
  const variables = { ...assembly.variables }
  for (const [name, value] of Object.entries(variables)) {
    if (value === undefined) variables[name] = `{{${name}}}`
  }
  return render({ ...assembly, variables })
}

/**
 * Insert the Argon block into one assembly's sections. INSERT-ONLY: the
 * original section list (and every byte of every original section) is preserved
 * verbatim; exactly one `argon:rules` section is added. Compatible with a
 * prompt already fused by dsh-unrestricted (the block lands after that plugin's
 * `unrestricted:execution-mode` when present) and with a plain stock prompt.
 *
 * @param sections - AssembledSection-shaped rows ({ name, text }) from the waterfall.
 * @param presetId - the composed preset id (must be one of PRESETS).
 * @returns `{ sections }` with the block inserted. Never rewrites any text, so it
 *   never produces anchor issues and cannot break dsh-unrestricted's fusion.
 */
export function fuseSections(sections, presetId) {
  if (!PRESET_RULES[presetId]) {
    return { issues: [`unknown preset "${presetId}"`] }
  }
  // Already injected (e.g. a second assembly pass) — leave untouched.
  if (sections.some(s => s.name === BLOCK_SECTION)) {
    return { sections }
  }

  // Placement: behind dsh-unrestricted's execution-mode block when present,
  // otherwise directly behind the persona, otherwise at the very top.
  let insertAfterIndex = sections.findIndex(s => s.name === 'unrestricted:execution-mode')
  if (insertAfterIndex < 0) {
    insertAfterIndex = sections.findIndex(s => s.name === 'deployment:persona-prefix')
  }

  const fused = [...sections]
  const block = { name: BLOCK_SECTION, text: buildArgonPromptBlock() }
  fused.splice(insertAfterIndex < 0 ? 0 : insertAfterIndex + 1, 0, block)
  return { sections: fused }
}
