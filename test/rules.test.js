import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ANCHORS,
  BLOCK_SECTION,
  buildArgonPromptBlock,
  contractFingerprint,
  fuseSections,
  fusedMinimalPrompt,
  minimalAnchorIssues,
} from '../src/rules.js'

const persona = { name: 'deployment:persona-prefix', text: ANCHORS.personaStandard }
const identity = { name: 'harness:identity', text: ANCHORS.identity }

test('buildArgonPromptBlock replaces the personality slot', () => {
  const block = buildArgonPromptBlock()
  assert.match(block, /Argon 模式/)
  assert.ok(block.includes('执笔与交付总则'))
  assert.ok(!block.includes('{{agent_personality}}'))
})

test('contractFingerprint is a 16-char lowercase hex digest', () => {
  assert.match(contractFingerprint(), /^[0-9a-f]{16}$/)
})

test('fuseSections inserts exactly one block after the persona and preserves input', () => {
  const sections = [identity, persona, { name: 'tools:ptc-only', text: 'x' }]
  const fused = fuseSections(sections, 'standard')
  assert.equal(fused.issues, undefined)
  assert.equal(fused.sections.filter(section => section.name === BLOCK_SECTION).length, 1)
  assert.deepEqual(fused.sections[0], identity)
  assert.deepEqual(fused.sections[1], persona)
  assert.equal(fused.sections[2].name, BLOCK_SECTION)
  assert.equal(sections.length, 3)
})

test('fuseSections is idempotent', () => {
  const first = fuseSections([persona], 'ptc')
  const second = fuseSections(first.sections, 'ptc')
  assert.equal(second.sections.filter(section => section.name === BLOCK_SECTION).length, 1)
})

test('fuseSections places the block after unrestricted:execution-mode', () => {
  const sections = [persona, { name: 'unrestricted:execution-mode', text: 'u' }]
  const fused = fuseSections(sections, 'cordis')
  assert.equal(fused.sections[1].name, 'unrestricted:execution-mode')
  assert.equal(fused.sections[2].name, BLOCK_SECTION)
})

test('fuseSections rejects unknown presets', () => {
  assert.deepEqual(fuseSections([persona], 'nope').issues, ['unknown preset "nope"'])
})

test('minimalAnchorIssues accepts the current minimal anchors', () => {
  assert.deepEqual(minimalAnchorIssues([
    { name: 'deployment:persona-prefix', text: ANCHORS.personaMinimal },
  ]), [])
  assert.deepEqual(minimalAnchorIssues([
    { name: 'deployment:persona-prefix', text: ANCHORS.personaMinimal },
    { name: 'tool:structured_output', text: ANCHORS.structuredOutputFull },
  ]), [])
})

test('minimalAnchorIssues reports persona and structured-output drift', () => {
  assert.deepEqual(minimalAnchorIssues([
    { name: 'deployment:persona-prefix', text: 'changed' },
  ]), ['preset persona changed'])
  assert.deepEqual(minimalAnchorIssues([
    { name: 'deployment:persona-prefix', text: ANCHORS.personaMinimal },
    { name: 'tool:structured_output', text: 'changed' },
  ]), ['structured-output instruction changed'])
})

test('fusedMinimalPrompt starts with the minimal persona and includes the block', () => {
  const prompt = fusedMinimalPrompt()
  assert.ok(prompt.startsWith(ANCHORS.personaMinimal))
  assert.ok(prompt.includes('Argon 模式'))
  const structured = fusedMinimalPrompt(ANCHORS.structuredOutputFull)
  assert.ok(structured.endsWith(ANCHORS.structuredOutputFull))
})
