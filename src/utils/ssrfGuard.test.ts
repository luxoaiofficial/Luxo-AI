import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidSecretEnvVarName,
  validateCustomProviderUrl,
} from './ssrfGuard';

test('validateCustomProviderUrl rejects loopback, metadata, private IPs, and non-HTTPS', () => {
  const blockedUrls = [
    'http://api.example.com/v1',
    'https://127.0.0.1/v1',
    'https://localhost:8080/v1',
    'https://169.254.169.254/latest/meta-data',
    'https://10.0.0.5/v1',
    'https://172.16.0.10/v1',
    'https://192.168.1.50/v1',
    'https://[::1]/v1',
    'https://internal.service.local/v1',
    'https://user:pass@api.example.com/v1',
  ];
  for (const url of blockedUrls) {
    const res = validateCustomProviderUrl(url);
    assert.equal(res.valid, false, `Expected SSRF guard to block ${url}`);
  }
});

test('validateCustomProviderUrl accepts legitimate HTTPS external endpoints and normalizes trailing slashes', () => {
  const res = validateCustomProviderUrl('https://api.together.xyz/v1/');
  assert.equal(res.valid, true);
  assert.equal(res.normalizedUrl, 'https://api.together.xyz/v1');
});

test('isValidSecretEnvVarName accepts env var names and rejects raw API keys', () => {
  assert.equal(isValidSecretEnvVarName('TOGETHER_API_KEY'), true);
  assert.equal(isValidSecretEnvVarName('CUSTOM_LLM_TOKEN_1'), true);
  assert.equal(isValidSecretEnvVarName('sk-live-secret123456'), false);
  assert.equal(isValidSecretEnvVarName('AIzaSyExampleKey'), false);
});
