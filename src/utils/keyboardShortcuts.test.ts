import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterKeyboardShortcutGroups,
  KEYBOARD_SHORTCUT_GROUPS,
} from './keyboardShortcuts';

test('KEYBOARD_SHORTCUT_GROUPS provides non-empty categorized shortcuts with unique ids', () => {
  assert.ok(KEYBOARD_SHORTCUT_GROUPS.length >= 3);
  const ids = new Set<string>();
  for (const group of KEYBOARD_SHORTCUT_GROUPS) {
    assert.ok(group.items.length >= 3);
    for (const item of group.items) {
      assert.equal(ids.has(item.id), false);
      ids.add(item.id);
      assert.ok(item.keys.length >= 1);
      assert.ok(item.title.length >= 3);
    }
  }
});

test('filterKeyboardShortcutGroups filters cleanly by title, description, or keycap', () => {
  const all = filterKeyboardShortcutGroups('');
  assert.equal(all.length, KEYBOARD_SHORTCUT_GROUPS.length);

  const pdfMatches = filterKeyboardShortcutGroups('PDF');
  assert.equal(pdfMatches.length, 1);
  assert.ok(
    pdfMatches[0].items.some((it) => it.id === 'shortcut-export-pdf')
  );

  const altMatches = filterKeyboardShortcutGroups('Alt');
  assert.ok(altMatches.length >= 1);
  assert.ok(altMatches[0].items.length >= 4);

  const empty = filterKeyboardShortcutGroups('zzz_no_such_shortcut');
  assert.equal(empty.length, 0);
});
