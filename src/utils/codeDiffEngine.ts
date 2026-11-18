export type DiffRowKind = 'unchanged' | 'added' | 'removed' | 'modified';

export interface SideBySideDiffRow {
  rowIndex: number;
  kind: DiffRowKind;
  leftLineNumber: number | null;
  rightLineNumber: number | null;
  leftText: string;
  rightText: string;
}

export interface SideBySideDiffSummary {
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount: number;
  totalRows: number;
  hasChanges: boolean;
}

export interface SideBySideDiffResult {
  rows: SideBySideDiffRow[];
  summary: SideBySideDiffSummary;
}

function normalizeLines(raw: string): string[] {
  const normalized = String(raw ?? '').replace(/\r\n/g, '\n');
  if (normalized.length === 0) return [];
  return normalized.split('\n');
}

/**
 * Computes an aligned side-by-side line diff using an LCS (Longest Common Subsequence) table,
 * pairing adjacent removals and additions into 'modified' rows for intuitive visual comparison.
 */
export function computeSideBySideDiff(
  leftSource: string,
  rightSource: string
): SideBySideDiffResult {
  const leftLines = normalizeLines(leftSource);
  const rightLines = normalizeLines(rightSource);
  const m = leftLines.length;
  const n = rightLines.length;

  // Guard against degenerate giant inputs: fallback to linear pairing beyond 1200 lines
  if (m * n > 900_000) {
    const maxLen = Math.max(m, n);
    const rows: SideBySideDiffRow[] = [];
    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;
    let unchangedCount = 0;

    for (let idx = 0; idx < maxLen; idx++) {
      const hasL = idx < m;
      const hasR = idx < n;
      const lVal = hasL ? leftLines[idx] : '';
      const rVal = hasR ? rightLines[idx] : '';
      if (hasL && hasR) {
        if (lVal === rVal) {
          unchangedCount++;
          rows.push({
            rowIndex: idx,
            kind: 'unchanged',
            leftLineNumber: idx + 1,
            rightLineNumber: idx + 1,
            leftText: lVal,
            rightText: rVal,
          });
        } else {
          modifiedCount++;
          rows.push({
            rowIndex: idx,
            kind: 'modified',
            leftLineNumber: idx + 1,
            rightLineNumber: idx + 1,
            leftText: lVal,
            rightText: rVal,
          });
        }
      } else if (hasL) {
        removedCount++;
        rows.push({
          rowIndex: idx,
          kind: 'removed',
          leftLineNumber: idx + 1,
          rightLineNumber: null,
          leftText: lVal,
          rightText: '',
        });
      } else {
        addedCount++;
        rows.push({
          rowIndex: idx,
          kind: 'added',
          leftLineNumber: null,
          rightLineNumber: idx + 1,
          leftText: '',
          rightText: rVal,
        });
      }
    }

    return {
      rows,
      summary: {
        addedCount,
        removedCount,
        modifiedCount,
        unchangedCount,
        totalRows: rows.length,
        hasChanges: addedCount + removedCount + modifiedCount > 0,
      },
    };
  }

  const dp: Uint32Array[] = Array.from(
    { length: m + 1 },
    () => new Uint32Array(n + 1)
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (leftLines[i] === rightLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
      }
    }
  }

  type RawOp = {
    op: 'equal' | 'remove' | 'add';
    leftIdx: number | null;
    rightIdx: number | null;
    text: string;
  };

  const ops: RawOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (leftLines[i] === rightLines[j]) {
      ops.push({ op: 'equal', leftIdx: i, rightIdx: j, text: leftLines[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ op: 'remove', leftIdx: i, rightIdx: null, text: leftLines[i] });
      i++;
    } else {
      ops.push({ op: 'add', leftIdx: null, rightIdx: j, text: rightLines[j] });
      j++;
    }
  }
  while (i < m) {
    ops.push({ op: 'remove', leftIdx: i, rightIdx: null, text: leftLines[i] });
    i++;
  }
  while (j < n) {
    ops.push({ op: 'add', leftIdx: null, rightIdx: j, text: rightLines[j] });
    j++;
  }

  const rows: SideBySideDiffRow[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let unchangedCount = 0;

  let k = 0;
  while (k < ops.length) {
    const cur = ops[k];
    if (cur.op === 'equal') {
      unchangedCount++;
      rows.push({
        rowIndex: rows.length,
        kind: 'unchanged',
        leftLineNumber: (cur.leftIdx ?? 0) + 1,
        rightLineNumber: (cur.rightIdx ?? 0) + 1,
        leftText: cur.text,
        rightText: cur.text,
      });
      k++;
      continue;
    }

    // Collect contiguous block of removes and adds to pair into modified rows
    const removes: RawOp[] = [];
    const adds: RawOp[] = [];
    while (k < ops.length && ops[k].op !== 'equal') {
      if (ops[k].op === 'remove') removes.push(ops[k]);
      else adds.push(ops[k]);
      k++;
    }

    const pairLen = Math.max(removes.length, adds.length);
    for (let p = 0; p < pairLen; p++) {
      const rem = p < removes.length ? removes[p] : null;
      const add = p < adds.length ? adds[p] : null;
      if (rem && add) {
        modifiedCount++;
        rows.push({
          rowIndex: rows.length,
          kind: 'modified',
          leftLineNumber: (rem.leftIdx ?? 0) + 1,
          rightLineNumber: (add.rightIdx ?? 0) + 1,
          leftText: rem.text,
          rightText: add.text,
        });
      } else if (rem) {
        removedCount++;
        rows.push({
          rowIndex: rows.length,
          kind: 'removed',
          leftLineNumber: (rem.leftIdx ?? 0) + 1,
          rightLineNumber: null,
          leftText: rem.text,
          rightText: '',
        });
      } else if (add) {
        addedCount++;
        rows.push({
          rowIndex: rows.length,
          kind: 'added',
          leftLineNumber: null,
          rightLineNumber: (add.rightIdx ?? 0) + 1,
          leftText: '',
          rightText: add.text,
        });
      }
    }
  }

  return {
    rows,
    summary: {
      addedCount,
      removedCount,
      modifiedCount,
      unchangedCount,
      totalRows: rows.length,
      hasChanges: addedCount + removedCount + modifiedCount > 0,
    },
  };
}
