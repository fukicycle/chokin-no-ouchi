// design のアイコンを表示する。色は CSS の color で変わる。
// 通常は線版、選択中・有効なときは glass を付ける。
const line = import.meta.glob<string>("/node_modules/@fukicycle/design/icons/line/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});
const glass = import.meta.glob<string>("/node_modules/@fukicycle/design/icons/glass/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type IconName =
  | "home"
  | "back"
  | "forward"
  | "close"
  | "menu"
  | "more"
  | "search"
  | "settings"
  | "add"
  | "edit"
  | "delete"
  | "share"
  | "download"
  | "copy"
  | "filter"
  | "sort"
  | "update"
  | "undo"
  | "check"
  | "info"
  | "warning"
  | "error"
  | "notify"
  | "camera"
  | "image"
  | "mic"
  | "play"
  | "pause"
  | "calendar"
  | "clock"
  | "timer"
  | "chart"
  | "list"
  | "user"
  | "chat"
  | "heart"
  | "bookmark"
  | "bike"
  | "route"
  | "pin"
  | "wallet"
  | "bread"
  | "thermo"
  | "cloud"
  | "lock"
  | "external"
  | "sun"
  | "moon"
  | "theme-auto"
  | "seigaiha"
  | "sakura"
  | "noren"
  | "enso";

const pick = (set: Record<string, string>, name: IconName) =>
  set[`/node_modules/@fukicycle/design/icons/${set === glass ? "glass" : "line"}/${name}.svg`] ?? "";

type Props = {
  name: IconName;
  glass?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Icon({ name, glass: isGlass = false, size = "md", className }: Props) {
  const svg = pick(isGlass ? glass : line, name);
  const cls = ["fk-icon", size !== "md" ? `fk-icon--${size}` : "", className ?? ""].filter(Boolean).join(" ");
  return <span className={cls} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
