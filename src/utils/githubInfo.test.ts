import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGithubPushCommands,
  deriveGithubPagesUrl,
  parseAndValidateGithubRepoUrl,
  PROJECT_GITHUB_PIPELINE,
} from './githubInfo.ts';

test('parseAndValidateGithubRepoUrl accepts full URLs and owner/repo shorthand', () => {
  const full = parseAndValidateGithubRepoUrl('https://github.com/acme-dev/luxo-ai.git/');
  assert.equal(full.valid, true);
  assert.equal(full.owner, 'acme-dev');
  assert.equal(full.repo, 'luxo-ai');
  assert.equal(full.canonicalUrl, 'https://github.com/acme-dev/luxo-ai');
  assert.equal(full.pagesUrl, 'https://acme-dev.github.io/luxo-ai/');

  const shorthand = parseAndValidateGithubRepoUrl('acme-dev/luxo-studio');
  assert.equal(shorthand.valid, true);
  assert.equal(shorthand.canonicalUrl, 'https://github.com/acme-dev/luxo-studio');
  assert.equal(shorthand.pagesUrl, 'https://acme-dev.github.io/luxo-studio/');
});

test('parseAndValidateGithubRepoUrl rejects invalid hosts, scripts, and incomplete paths', () => {
  assert.equal(parseAndValidateGithubRepoUrl('').valid, false);
  assert.equal(parseAndValidateGithubRepoUrl('javascript:alert(1)').valid, false);
  assert.equal(parseAndValidateGithubRepoUrl('https://gitlab.com/user/repo').valid, false);
  assert.equal(parseAndValidateGithubRepoUrl('https://github.com/onlyuser').valid, false);
});

test('deriveGithubPagesUrl handles root user pages repos cleanly', () => {
  assert.equal(
    deriveGithubPagesUrl('AcmeDev', 'acmedev.github.io'),
    'https://acmedev.github.io/'
  );
  assert.equal(
    deriveGithubPagesUrl('AcmeDev', 'luxo-ai'),
    'https://acmedev.github.io/luxo-ai/'
  );
});

test('PROJECT_GITHUB_PIPELINE and buildGithubPushCommands reflect workflow configuration', () => {
  assert.equal(PROJECT_GITHUB_PIPELINE.workflowPath, '.github/workflows/deploy-static.yml');
  assert.equal(PROJECT_GITHUB_PIPELINE.triggerBranch, 'main');
  const cmds = buildGithubPushCommands('https://github.com/demo/site');
  assert.ok(cmds.includes('git remote add origin https://github.com/demo/site.git'));
  assert.ok(cmds.includes('git push -u origin main'));
});
