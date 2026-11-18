import assert from 'node:assert/strict';
import test from 'node:test';
import { computeSideBySideDiff } from './codeDiffEngine.ts';

test('computeSideBySideDiff returns unchanged rows when texts match', () => {
  const src = 'const a = 1;\nconst b = 2;\nreturn a + b;';
  const res = computeSideBySideDiff(src, src);
  assert.equal(res.summary.hasChanges, false);
  assert.equal(res.summary.unchangedCount, 3);
  assert.equal(res.summary.addedCount, 0);
  assert.equal(res.summary.removedCount, 0);
  assert.equal(res.summary.modifiedCount, 0);
  assert.equal(res.rows[0].leftLineNumber, 1);
  assert.equal(res.rows[0].rightLineNumber, 1);
});

test('computeSideBySideDiff detects added, removed, and modified lines cleanly', () => {
  const left = [
    'function greet(name) {',
    '  const msg = "Hi " + name;',
    '  console.log(msg);',
    '  return msg;',
    '}',
  ].join('\n');

  const right = [
    'function greet(name: string) {',
    '  const msg = `Merhaba ${name}`;',
    '  // formatted output',
    '  return msg;',
    '}',
  ].join('\n');

  const res = computeSideBySideDiff(left, right);
  assert.equal(res.summary.hasChanges, true);
  assert.equal(res.summary.modifiedCount, 3);
  assert.equal(res.summary.unchangedCount, 2);
  assert.ok(res.rows.some((r) => r.kind === 'modified' && r.leftLineNumber === 1 && r.rightLineNumber === 1));
  assert.ok(res.rows.some((r) => r.kind === 'unchanged' && r.rightText === '}'));
});

test('computeSideBySideDiff handles pure additions and pure removals', () => {
  const added = computeSideBySideDiff('line1', 'line1\nline2\nline3');
  assert.equal(added.summary.addedCount, 2);
  assert.equal(added.summary.removedCount, 0);
  assert.equal(added.summary.unchangedCount, 1);

  const removed = computeSideBySideDiff('line1\nline2\nline3', 'line1');
  assert.equal(removed.summary.removedCount, 2);
  assert.equal(removed.summary.addedCount, 0);
  assert.equal(removed.summary.unchangedCount, 1);
});
