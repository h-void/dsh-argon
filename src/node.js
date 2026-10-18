/**
 * dsh-argon host half: fuses the Argon task charter and writing rules
 * into each preset's system prompt at assembly time.
 *
 * Upgraded to match dsh-unrestricted 0.2.4:
 * - Supports DSH alpha.4 `agentPresets.acquireScope(presetId)` with `createScope` fallback.
 * - Supports rosterless profiles (`headless`, `acp`, `sdk`) by inferring `ptc` / `standard`
 *   when `agentPresets` is absent.
 * - Synchronizes `minimal` preset complete-persona shadows across `agent/created`,
 *   `agent-preset/selected` (blank-session preset switching), and `agent/disposed`,
 *   while preserving `structured_output` instructions on structured subagents.
 * - Preserves caller-registered Minimal personas (native delegation) by fusing the
 *   Argon block at assembly time instead of failing the duplicate section.
 * - Passes the agent scope to `tools.schemas()` so structured subagents keep the
 *   official `structured_output` guidance.
 * - Tracks live top-level fused previews vs standing-scope previews (`source: 'live' | 'standing'`)
 *   without allowing subagents to overwrite top-level preset previews.
 * - Retains Argon module inventory stats alongside per-preset mode status.
 */
import z from '@deepseek-ai/schemastery'
import { renderPrompt } from '@deepseek-ai/dsh-system-prompt'
import { createScope } from '@deepseek-ai/dsh-scope'
import {
  ANCHORS,
  BLOCK_SECTION,
  PRESETS,
  PRESET_RULES,
  loadAsset,
  buildArgonPromptBlock,
  contractFingerprint,
  fuseSections,
  fusedMinimalPrompt,
  minimalAnchorIssues,
  renderPreview,
} from './rules.js'

/** Cordis plugin name used by Loader diagnostics. */
export const name = 'dsh-argon'

/** Services required by this plugin (all base-backed profiles provide these). */
export const inject = ['settings', 'systemPrompt', 'loader']

const RPC_CHANNEL = '/dsh-argon'

export const Config = z.object({
  enabled: z.boolean().default(false),
}).default({ enabled: false }).volatile()

export { BLOCK_SECTION }

/** Human-readable error text for status and RPC error branches. */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error)
}

/** RpcResult success branch. */
function ok(value) {
  return { ok: true, value }
}

/**
 * @param ctx - plugin context carrying settings, systemPrompt, loader, and
 *   optional agentPresets / connection services.
 */
export function apply(ctx, config) {
  ctx.effect(() => ctx.settings.configure({ auto: false }, ctx.fiber))

  const state = {
    enabled: config.get ? config.get().enabled : config.enabled,
    /** presetId -> issue strings; a preset with an empty list is verified. */
    startup: new Map(),
    /** presetId -> in-flight startup check. */
    checking: new Map(),
    /** presetId -> issue strings observed on live assemblies. */
    runtime: new Map(),
    /** Agent -> section disposer for minimal persona shadows. */
    shadows: new Map(),
    /** 已由调用方在 agent scope 注册 persona 的 Minimal agent。 */
    customMinimal: new WeakSet(),
    /** Fused minimal prompt, computed only after the minimal anchors verify. */
    fusedMinimal: null,
    /** presetId -> last successfully fused top-level live assembly (the deploy preview). */
    fusedText: new Map(),
  }

  /** All known issues for one preset (startup check + live observations). */
  function modeIssues(presetId) {
    return [...state.startup.get(presetId) ?? [], ...state.runtime.get(presetId) ?? []]
  }

  /**
   * Read the standing assembly of a preset using the registry's scope lease
   * (or a temporary mounted scope fallback). In rosterless profiles, assemble
   * the global host layer directly.
   */
  async function presetAssembly(presetId) {
    await ctx.loader.await()
    const presets = ctx.get('agentPresets')
    if (presets === undefined) {
      return await ctx.systemPrompt.assemble({})
    }
    if (typeof presets.acquireScope === 'function') {
      const lease = await presets.acquireScope(presetId)
      try {
        return await ctx.systemPrompt.assemble({ scope: lease.key })
      } finally {
        await lease[Symbol.asyncDispose]()
      }
    }
    const key = {}
    const scope = createScope(ctx, key)
    try {
      await presets.mount(scope.ctx, presetId)
      return await ctx.systemPrompt.assemble({ scope: key })
    } finally {
      await scope.dispose()
    }
  }

  /**
   * Run the standing-scope anchor check for ONE preset (lazy per-preset, so a
   * minimal toggle never waits on the other three mounts). Idempotent per
   * preset until `recheck` clears it.
   */
  function ensureCheck(presetId) {
    let pending = state.checking.get(presetId)
    if (pending !== undefined) return pending
    pending = (async () => {
      const issues = []
      try {
        await ctx.loader.await()
        const presets = ctx.get('agentPresets')
        if (presets === undefined) {
          state.startup.set(presetId, presetId === 'minimal'
            ? ['minimal preset is not available in this profile']
            : issues)
          return
        }
        const assembly = await presetAssembly(presetId)
        const fused = fuseSections(assembly.sections, presetId)
        if (fused.issues !== undefined) issues.push(...fused.issues)
        if (presetId === 'minimal') issues.push(...minimalAnchorIssues(assembly.sections))
      } catch (error) {
        issues.push(`preset probe failed: ${messageOf(error)}`)
      }
      state.startup.set(presetId, issues)
      if (presetId === 'minimal') {
        state.fusedMinimal = issues.length === 0 ? fusedMinimalPrompt() : null
      }
    })().catch((error) => {
      state.startup.set(presetId, [`preset probe failed: ${messageOf(error)}`])
      if (presetId === 'minimal') state.fusedMinimal = null
    })
    state.checking.set(presetId, pending)
    return pending
  }

  /** Check every preset once (status surface and the `recheck` endpoint). */
  function ensureChecks() {
    return Promise.all(PRESETS.map(presetId => ensureCheck(presetId)))
  }

  /** Whether one preset may currently be fused. */
  function usable(presetId) {
    return PRESETS.includes(presetId) && modeIssues(presetId).length === 0
  }

  /**
   * Remove a minimal persona shadow from an agent when it switches preset, is
   * disposed, or Argon mode turns off.
   */
  function unshadowMinimal(agent) {
    const dispose = state.shadows.get(agent)
    if (dispose === undefined) return
    state.shadows.delete(agent)
    dispose()
  }

  /**
   * Resolve the composed preset id for a live agent, or infer `ptc`/`standard`
   * when running in a rosterless profile (e.g. headless / sdk).
   */
  function resolveAgentPreset(agent, sections) {
    const presets = ctx.get('agentPresets')
    if (presets !== undefined) {
      try {
        return presets.composedPreset(agent.ctx)
      } catch {
        return undefined
      }
    }
    if (sections !== undefined) {
      return sections.some(s => s.name === 'tools:ptc-only' && s.text.trim() !== '')
        ? 'ptc'
        : 'standard'
    }
    return undefined
  }

  /**
   * Synchronize a minimal agent's complete persona shadow with its current
   * preset and toggle state. If the agent is no longer on `minimal`, any stale
   * shadow from an earlier blank-session preset selection is disposed.
   */
  function syncMinimalShadow(agent) {
    if (!state.enabled || state.fusedMinimal === null) {
      unshadowMinimal(agent)
      return
    }
    const presetId = resolveAgentPreset(agent)
    if (presetId !== 'minimal') {
      unshadowMinimal(agent)
      return
    }
    if (state.shadows.has(agent) || state.customMinimal.has(agent)) return
    // Register a complete `deployment:persona-prefix` shadow at agent scope.
    // dsh-unrestricted registers the SAME section name for minimal; within one
    // layer a duplicate insert throws. When the caller (native delegation) or
    // dsh-unrestricted already owns the section, keep that persona and fuse the
    // Argon block at assembly time instead of overriding it.
    let dispose
    try {
      dispose = agent.ctx.systemPrompt.section({
        name: 'deployment:persona-prefix',
        order: 0,
        complete: true,
        text: (context) => {
          // 结构化工具注册在子代理 scope，不能只查询全局工具目录。
          const hasStructured = context?.agent?.ctx?.tools
            ?.schemas?.(context.agent)
            ?.some(tool => tool.name === 'structured_output') === true
          return hasStructured
            ? fusedMinimalPrompt(ANCHORS.structuredOutputFull)
            : fusedMinimalPrompt()
        },
      })
    } catch (error) {
      // 原生委派角色已占用同一名称；保留调用方贡献，在组装时融合。
      if (messageOf(error) !== 'prompt section "deployment:persona-prefix" is already registered in this scope') throw error
      state.customMinimal.add(agent)
      return
    }
    state.shadows.set(agent, dispose)
  }

  /** Synchronize minimal persona shadows across all live agents. */
  function sweepAgents() {
    const agents = ctx.get('agents')
    if (agents === undefined) return
    for (const agent of agents.list()) syncMinimalShadow(agent)
  }

  /** Drop every persona shadow (toggle off or plugin disposal). */
  function clearShadows() {
    for (const [, dispose] of state.shadows) dispose()
    state.shadows.clear()
  }

  function onEnable() {
    void ensureChecks()
    void ensureCheck('minimal').then(() => sweepAgents())
  }

  function onDisable() {
    clearShadows()
    state.fusedText.clear()
  }

  /** Current card view: toggle, per-preset state, contract fingerprint, and Argon module stats. */
  function statusPayload() {
    const promptBlock = buildArgonPromptBlock()
    const modes = {}
    for (const presetId of PRESETS) {
      const issues = modeIssues(presetId)
      modes[presetId] = {
        state: !state.enabled
          ? 'off'
          : !state.startup.has(presetId)
            ? 'checking'
            : issues.length > 0 ? 'failed' : 'active',
        issues,
      }
    }
    const systemChars = loadAsset('system.md').length
    const personalityChars = loadAsset('personality.md').length
    return {
      enabled: state.enabled,
      contract: contractFingerprint(),
      modes,
      modules: [
        { id: 'systemPrompt', name: 'Task Charter (任务宪章)', chars: systemChars, status: systemChars > 0 ? 'ready' : 'missing' },
        { id: 'personality', name: 'Writing Rules (执笔与交付总则)', chars: personalityChars, status: personalityChars > 0 ? 'ready' : 'missing' },
      ],
      chars: promptBlock.length,
      lines: promptBlock.split('\n').length,
      bytes: Buffer.byteLength(promptBlock, 'utf8'),
    }
  }

  /** One line-count/byte/char summary for previews. */
  function summarize(text) {
    return {
      text,
      chars: text.length,
      bytes: Buffer.byteLength(text, 'utf8'),
      lines: text.split('\n').length,
    }
  }

  /**
   * Variables to bind in a standing-scope preview when a live agent exists.
   */
  function previewVariables() {
    const variables = {}
    try {
      const agents = ctx.get('agents')
      const agent = agents?.list?.()[0]
      if (agent !== undefined) {
        variables.provider = agent.options.provider
        variables.model = agent.options.model
        variables.cwd = agent.session.header.cwd
      }
    } catch {
      // No agent service or an unreadable session: literal slots are fine.
    }
    return variables
  }

  /**
   * Build the deploy preview for ONE preset (or fallback to block preview if presetId omitted).
   */
  async function previewFor(presetId) {
    const contract = contractFingerprint()
    if (!presetId) {
      const promptBlock = buildArgonPromptBlock()
      return {
        presetId: 'block',
        contract,
        available: true,
        source: 'standing',
        ...summarize(promptBlock),
      }
    }
    if (!PRESETS.includes(presetId)) {
      return { presetId, contract, available: false, reason: `unknown preset "${presetId}"` }
    }
    await ensureCheck(presetId)
    if (!usable(presetId)) {
      return { presetId, contract, available: false, reason: modeIssues(presetId).join('; ') || 'preset check failed' }
    }
    if (presetId === 'minimal') {
      if (ctx.get('agentPresets') === undefined) {
        return { presetId, contract, available: false, reason: 'minimal preset is not available in this profile' }
      }
      if (state.fusedMinimal === null) {
        return { presetId, contract, available: false, reason: 'minimal anchor check failed' }
      }
      try {
        const assembly = await presetAssembly('minimal')
        const block = fusedMinimalPrompt()
        const hasPersona = assembly.sections.some(section => section.name === 'deployment:persona-prefix')
        const sections = hasPersona
          ? assembly.sections.map(section => section.name === 'deployment:persona-prefix' ? { ...section, text: block } : section)
          : [{ name: 'deployment:persona-prefix', text: block }, ...assembly.sections]
        const variables = { ...assembly.variables, ...previewVariables() }
        const text = renderPreview({ ...assembly, sections, variables }, renderPrompt)
        return { presetId, contract, available: true, source: 'standing', ...summarize(text) }
      } catch (error) {
        return { presetId, contract, available: false, reason: `preview probe failed: ${messageOf(error)}` }
      }
    }
    const cached = state.fusedText.get(presetId)
    if (cached !== undefined) {
      return { presetId, contract, available: true, source: 'live', ...summarize(cached) }
    }
    try {
      const assembly = await presetAssembly(presetId)
      const fused = fuseSections(assembly.sections, presetId)
      if (fused.issues !== undefined) {
        return { presetId, contract, available: false, reason: fused.issues.join('; ') }
      }
      const variables = { ...assembly.variables, ...previewVariables() }
      const text = renderPreview({ ...assembly, sections: fused.sections, variables }, renderPrompt)
      return { presetId, contract, available: true, source: 'standing', ...summarize(text) }
    } catch (error) {
      return { presetId, contract, available: false, reason: `preview probe failed: ${messageOf(error)}` }
    }
  }

  /** RPC endpoint handler for the settings card. */
  async function handleRpc(endpoint, payload) {
    switch (endpoint) {
      case 'status': {
        if (state.enabled) await ensureChecks()
        return ok(statusPayload())
      }
      case 'preview': {
        const presetId = payload?.presetId ?? payload?.args?.presetId
        return ok(await previewFor(presetId))
      }
      case 'recheck': {
        state.checking.clear()
        state.startup.clear()
        state.runtime.clear()
        state.fusedText.clear()
        await ensureChecks()
        if (state.enabled) sweepAgents()
        return ok(statusPayload())
      }
      default:
        return { ok: false, error: { code: 'internal', message: `dsh-argon: unknown endpoint ${JSON.stringify(endpoint)}`, details: {} } }
    }
  }

  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    const original = await next()
    if (!state.enabled || !original || !Array.isArray(original.sections)) return original
    const agent = context.agent
    if (agent === undefined) return original
    const presetId = resolveAgentPreset(agent, original.sections)
    if (presetId === undefined || !PRESET_RULES[presetId]) {
      unshadowMinimal(agent)
      return original
    }
    if (presetId === 'minimal') {
      if (state.shadows.has(agent) && state.fusedMinimal !== null) {
        return original
      }
      await ensureCheck('minimal')
      syncMinimalShadow(agent)
      if (state.customMinimal.has(agent) && usable('minimal')) {
        const fused = fuseSections(original.sections, 'minimal')
        if (fused.issues !== undefined) {
          state.runtime.set('minimal', fused.issues)
          return original
        }
        return { ...original, sections: fused.sections }
      }
      return original
    }
    if (state.shadows.has(agent)) {
      unshadowMinimal(agent)
    }
    if (!usable(presetId)) return original
    const isSubagent = Array.isArray(original.contexts) && original.contexts.some(entry => entry.name === 'subagent:delegation')
    const fused = fuseSections(original.sections, presetId)
    if (fused.issues !== undefined) {
      state.runtime.set(presetId, fused.issues)
      return original
    }
    // Keep the deployed top-level fusion for the card preview; a subagent may
    // carry a custom persona, so it must not overwrite the preset's top-level cache.
    if (!isSubagent) {
      try {
        state.fusedText.set(presetId, renderPreview({ ...original, sections: fused.sections }, renderPrompt))
      } catch {
        state.fusedText.delete(presetId)
      }
    }
    return { ...original, sections: fused.sections }
  })

  ctx.on('agent/created', ({ agent }) => {
    if (!state.enabled) return
    void ensureCheck('minimal').then(() => syncMinimalShadow(agent))
  })

  ctx.on('agent-preset/selected', (sessionId) => {
    const agent = ctx.get('agents')?.get?.(sessionId)
    if (agent === undefined) return
    state.customMinimal.delete(agent)
    if (!state.enabled) {
      unshadowMinimal(agent)
      return
    }
    void ensureCheck('minimal').then(() => syncMinimalShadow(agent))
  })

  ctx.on('agent/disposed', ({ agent }) => {
    state.customMinimal.delete(agent)
    unshadowMinimal(agent)
  })

  ctx.effect(() => {
    const unwatch = ctx.on('loader/volatile-update', () => {
      const enabled = config.get ? config.get().enabled : config.enabled
      if (enabled === state.enabled) return
      state.enabled = enabled
      if (enabled) onEnable()
      else onDisable()
    })
    if (state.enabled) onEnable()
    return () => {
      state.enabled = false
      unwatch()
      clearShadows()
    }
  }, 'dsh-argon: toggle lifecycle')

  // Web 状态通道由官方 Connection 认证；headless 组合无需提供 connection 服务。
  ctx.inject(['connection'], (connectionCtx) => {
    const disposeRpc = connectionCtx.connection.rpc.handle(RPC_CHANNEL, handleRpc)
    return async () => {
      await disposeRpc()
    }
  })
}
