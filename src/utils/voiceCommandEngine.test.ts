import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVoiceCommand, SAMPLE_VOICE_COMMANDS } from './voiceCommandEngine';

test('parseVoiceCommand recognizes English & Turkish theme, navigation, project, CMS, and model commands', () => {
  const dark = parseVoiceCommand('Switch to Dark Mode');
  assert.equal(dark.type, 'switch_theme');
  if (dark.type === 'switch_theme') {
    assert.equal(dark.theme, 'dark');
  }

  const light = parseVoiceCommand('Açık temaya geç lütfen');
  assert.equal(light.type, 'switch_theme');
  if (light.type === 'switch_theme') {
    assert.equal(light.theme, 'light');
  }

  const proj = parseVoiceCommand('Start a new project called Apollo Analytics');
  assert.equal(proj.type, 'new_project');
  if (proj.type === 'new_project') {
    assert.equal(proj.projectName, 'Apollo Analytics');
  }

  const lib = parseVoiceCommand('Show me my library');
  assert.equal(lib.type, 'navigate');
  if (lib.type === 'navigate') {
    assert.equal(lib.targetView, 'library');
  }

  const dash = parseVoiceCommand('Open dashboard');
  assert.equal(dash.type, 'navigate');
  if (dash.type === 'navigate') {
    assert.equal(dash.targetView, 'dashboard');
  }

  const metrics = parseVoiceCommand('Show model performance metrics');
  assert.equal(metrics.type, 'open_model_metrics');

  const cms = parseVoiceCommand('Open CMS content studio');
  assert.equal(cms.type, 'open_cms');

  const model = parseVoiceCommand('Select Gemini 4 Hydrogen');
  assert.equal(model.type, 'select_model');
  if (model.type === 'select_model') {
    assert.equal(model.modelId, 'gemini-4-hydrogen');
  }

  const fallback = parseVoiceCommand('Bana TypeScript generic rehberi yaz');
  assert.equal(fallback.type, 'chat_prompt');
});

test('SAMPLE_VOICE_COMMANDS all parse to non-fallback actionable commands', () => {
  assert.ok(SAMPLE_VOICE_COMMANDS.length >= 6);
  for (const item of SAMPLE_VOICE_COMMANDS) {
    const parsed = parseVoiceCommand(item.command);
    assert.notEqual(parsed.type, 'chat_prompt');
  }
});
