import Papa from 'papaparse';

import type { Memo } from './types';


export type MemoRow = {
  category_name: string;
  memo: string;
  alarm_date: string;
  tag: string;
  createDate: string;
};


export function memosToCsv(memos: Memo[]): string {
  const rows: MemoRow[] = memos.map((m) => ({
    category_name: m.category_name,
    memo: m.memo,
    alarm_date: m.alarm_date ?? '',
    tag: (m.tag ?? []).join(';'),
    createDate: m.createDate,
  }));
  return Papa.unparse(rows, {
    columns: ['category_name', 'memo', 'alarm_date', 'tag', 'createDate'],
  });
}


export type ParsedMemo = {
  category_name: string;
  memo: string;
  alarm_date: string | null;
  tag: string[];
};


export function csvToMemos(csv: string): { rows: ParsedMemo[]; errors: string[] } {
  const result = Papa.parse<MemoRow>(csv, { header: true, skipEmptyLines: true });
  const errors = result.errors.map((e) =>
    typeof e.row === 'number' ? `${e.row + 2}행: ${e.message}` : e.message,
  );
  const rows: ParsedMemo[] = [];
  for (const r of result.data) {
    if (!r.category_name || !r.memo) continue;
    rows.push({
      category_name: r.category_name.trim(),
      memo: r.memo,
      alarm_date: r.alarm_date?.trim() ? r.alarm_date.trim() : null,
      tag: (r.tag ?? '')
        .split(';')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }
  return { rows, errors };
}
