// RELEASE_NOTES.md を読み取る。ビルド時（vite.config.ts）とアプリ内の両方で使う。

export type ReleaseNote = {
  version: string; // "1.3.0"（先頭の v は付けない）
  date: string; // "2026-11-02"
  items: string[]; // 使う人向けの箇条書き
};

const HEADING = /^##\s+v?(\d+\.\d+\.\d+)\s*(?:[—–-]+\s*(\d{4}-\d{2}-\d{2}))?\s*$/;

/** "## v1.3.0 — 2026-11-02" の見出しと、その下の "- " の行を版ごとにまとめる（新しい順のまま） */
export function parseReleaseNotes(markdown: string): ReleaseNote[] {
  const notes: ReleaseNote[] = [];
  let current: ReleaseNote | null = null;
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    const h = HEADING.exec(line);
    if (h) {
      current = { version: h[1], date: h[2] ?? "", items: [] };
      notes.push(current);
      continue;
    }
    if (current && /^[-*]\s+/.test(line)) {
      current.items.push(line.replace(/^[-*]\s+/, ""));
    }
  }
  return notes;
}

/** a が b より新しければ正、同じなら 0、古ければ負 */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export type VersionInfo = {
  version: string;
  date: string;
  notes: string[];
};
