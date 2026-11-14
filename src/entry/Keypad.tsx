// 金額を打つテンキー。端末のキーボードを使わないので、画面がせり上がらず、キーの位置もいつも同じ。

export type Key = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "00" | "back";

const KEYS: Key[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"];
const MAX_DIGITS = 8;

/** 今の金額（数字の文字列）にキーを1つ打った結果 */
export const pressKey = (amount: string, key: string) => {
  if (key === "back") return amount.slice(0, -1);
  // 先頭に 0 は並べない
  const next = (amount + key).replace(/^0+/, "");
  return next.length > MAX_DIGITS ? amount : next;
};

export function Keypad({ onPress }: { onPress: (key: Key) => void }) {
  return (
    <div className="keypad" role="group" aria-label="金額を打つ">
      {KEYS.map((k) => (
        <button
          key={k}
          className="key"
          aria-label={k === "back" ? "1文字消す" : k}
          // 押した瞬間に入れる（指を離すのを待たない）。続けて速く打っても取りこぼさない
          onPointerDown={(e) => {
            e.preventDefault();
            onPress(k);
          }}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPress(k)}
        >
          {k === "back" ? <BackspaceIcon /> : k}
        </button>
      ))}
    </div>
  );
}

// 「1文字消す」の印。design のアイコンにまだ無いので、同じ格子（24×24）・線幅（1.6）でここに描いてある。
// 「戻る」の矢印を流用すると意味が変わってしまう。design リポジトリに足したら差し替える。
function BackspaceIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7 6-7Z" />
      <path d="m12 9.5 5 5m0-5-5 5" />
    </svg>
  );
}
