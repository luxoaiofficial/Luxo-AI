import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { getModelBrandLogoUrl, LUXO_MODELS, LUXO_MODEL_IDS } from './luxoLogic';
import {
  isTrustedGoogleApiMediaUrl,
  resolveSafeStoredFilePath,
  sanitizeSeoTargetUrl,
  signSocialAdminToken,
  verifySocialAdminToken,
} from './securityHelpers';

test('Every AI model maps to an existing distinct local SVG brand logo asset', () => {
  const seenLogos = new Set<string>();
  for (const modelId of LUXO_MODEL_IDS) {
    const model = LUXO_MODELS[modelId];
    assert.ok(model.logoUrl, `Missing logoUrl for ${modelId}`);
    assert.ok(
      model.logoUrl.startsWith('/logos/') && model.logoUrl.endsWith('.svg'),
      `Expected /logos/*.svg path for ${modelId}, got ${model.logoUrl}`
    );
    const diskPath = path.resolve(process.cwd(), 'public', model.logoUrl.slice(1));
    assert.ok(fs.existsSync(diskPath), `Logo SVG missing on disk: ${diskPath}`);
    seenLogos.add(model.logoUrl);
  }
  assert.ok(seenLogos.size >= 12, `Expected >= 12 distinct brand logos, got ${seenLogos.size}`);

  assert.equal(getModelBrandLogoUrl('gemini-4-hydrogen', 'Gemini 4 Hydrogen', 'Google Gemini'), '/logos/gemini.svg');
  assert.equal(getModelBrandLogoUrl('chatgpt-5-2-pro', 'ChatGPT-5.2 Pro', 'OpenAI & ChatGPT'), '/logos/openai.svg');
  assert.equal(getModelBrandLogoUrl('claude-5-5-opus', 'Claude 5.5 Opus', 'Anthropic Claude'), '/logos/claude.svg');
  assert.equal(getModelBrandLogoUrl('deepseek-r2', 'DeepSeek R2', 'DeepSeek'), '/logos/deepseek.svg');
  assert.equal(getModelBrandLogoUrl('grok-4-heavy', 'Grok 4 Heavy', 'Grok & Meta Llama'), '/logos/grok.svg');
  assert.equal(getModelBrandLogoUrl('llama-4-behemoth', 'Llama 4 Behemoth', 'Grok & Meta Llama'), '/logos/meta.svg');
  assert.equal(getModelBrandLogoUrl('mistral-large-2', 'Mistral Large 2', 'Mistral & Qwen'), '/logos/mistral.svg');
  assert.equal(getModelBrandLogoUrl('qwen-3-max', 'Qwen 3 Max', 'Mistral & Qwen'), '/logos/qwen.svg');
  assert.equal(getModelBrandLogoUrl('perplexity-sonar-pro', 'Perplexity Sonar Pro', 'Perplexity & Küresel AI'), '/logos/perplexity.svg');
  assert.equal(getModelBrandLogoUrl('luxo-sol', 'Luxo Sol', 'Luxo Özel'), '/logos/sol.svg');
  assert.equal(getModelBrandLogoUrl('luxo-luna', 'Luxo Luna', 'Luxo Özel'), '/logos/luna.svg');
});

test('resolveSafeStoredFilePath blocks path traversal, slashes, and invalid extensions', () => {
  const baseDir = '/tmp/luxo-videos-test';
  const safe = resolveSafeStoredFilePath(baseDir, 'showcase-veo.mp4', /^[a-zA-Z0-9_-]+\.mp4$/);
  assert.equal(safe, path.resolve(baseDir, 'showcase-veo.mp4'));

  assert.equal(resolveSafeStoredFilePath(baseDir, '../../etc/passwd.mp4', /^[a-zA-Z0-9_-]+\.mp4$/), null);
  assert.equal(resolveSafeStoredFilePath(baseDir, '..\\secret.mp4', /^[a-zA-Z0-9_-]+\.mp4$/), null);
  assert.equal(resolveSafeStoredFilePath(baseDir, 'sub/video.mp4', /^[a-zA-Z0-9_-]+\.mp4$/), null);
  assert.equal(resolveSafeStoredFilePath(baseDir, '..mp4', /^[a-zA-Z0-9_-]+\.mp4$/), null);
});

test('isTrustedGoogleApiMediaUrl and sanitizeSeoTargetUrl reject untrusted hosts and metadata IPs', () => {
  assert.equal(isTrustedGoogleApiMediaUrl('https://generativelanguage.googleapis.com/v1beta/files/123'), true);
  assert.equal(isTrustedGoogleApiMediaUrl('http://generativelanguage.googleapis.com/v1beta/files/123'), false);
  assert.equal(isTrustedGoogleApiMediaUrl('http://169.254.169.254/latest/meta-data/'), false);
  assert.equal(isTrustedGoogleApiMediaUrl('https://evil.example.com/steal-key'), false);

  assert.equal(sanitizeSeoTargetUrl('https://luxo.ai/blog\nIGNORE ALL', 'https://luxo.ai/'), 'https://luxo.ai/blog');
  assert.equal(sanitizeSeoTargetUrl('http://169.254.169.254/latest/meta-data/', 'https://luxo.ai/'), 'https://luxo.ai/');
  assert.equal(sanitizeSeoTargetUrl('javascript:alert(1)', 'https://luxo.ai/'), 'https://luxo.ai/');
});

test('Social admin HMAC capability token binds exclusively to claimed admin UID and rejects tampering', () => {
  const secret = 'test-ephemeral-secret';
  const token = signSocialAdminToken('usr_owner_1', secret);
  assert.equal(verifySocialAdminToken(token, 'usr_owner_1', secret), true);
  assert.equal(verifySocialAdminToken(token, 'usr_attacker_2', secret), false);
  assert.equal(verifySocialAdminToken(token + 'x', 'usr_owner_1', secret), false);
  assert.equal(verifySocialAdminToken('', 'usr_owner_1', secret), false);
});

test('normalizePromptIntent does not false-trigger code boilerplate on React speed questions and produces distinct model responses', async () => {
  const { normalizePromptIntent, synthesizeAuthenticModelResponse } = await import('./aiPersonaEngine');
  const prompt = 'React uygulamasında açılış hızını artırmak için en kritik 2 yöntemi kısaca yaz.';
  const intent = normalizePromptIntent(prompt);
  assert.equal(intent.wantsCode, false);
  assert.equal(intent.domain, 'seo-perf-ux');

  const modelIds = ['claude-5-5-opus', 'gemini-4-carbon', 'chatgpt-5-2-pro', 'deepseek-r2'] as const;
  const outputs = modelIds.map((id) =>
    synthesizeAuthenticModelResponse({
      prompt,
      modelId: id,
      model: LUXO_MODELS[id],
      routedModelId: id,
      forceSearch: false,
    }).text
  );

  for (const out of outputs) {
    assert.ok(!out.includes('SlidingWindowLimiter') && !out.includes('TokenBucketLimiter'));
    assert.ok(/React\.lazy|chunk|bundle|FCP|LCP|font|preload/i.test(out));
  }
  assert.equal(new Set(outputs).size, modelIds.length, 'Each model family must produce a distinct response');

  const codeIntent = normalizePromptIntent('React ile hızlı filtreleme yapan bir lazy component kodu yaz.');
  assert.equal(codeIntent.wantsCode, true);
  assert.equal(codeIntent.domain, 'software-code');
  const codeReply = synthesizeAuthenticModelResponse({
    prompt: 'React ile hızlı filtreleme yapan bir lazy component kodu yaz.',
    modelId: 'claude-5-5-opus',
    model: LUXO_MODELS['claude-5-5-opus'],
    routedModelId: 'claude-5-5-opus',
    forceSearch: false,
  });
  assert.ok(codeReply.text.includes('FastWorkspaceShell') && codeReply.text.includes('React.lazy'));
});

