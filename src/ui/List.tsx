// 罫線で区切る一覧。設定などの「項目が縦に並ぶ画面」で使う。
// 囲み（カード）は使わず、区分は見出しと罫線で分ける。
// 行の種類で見た目の約束をそろえる：
//   藍の文字 …… 押すとその場で実行する（書き出し、新しい版を確認）
//   › ……………… 押すと次の画面へ進む
//   ↗ ……………… アプリの外で開く
//   赤の文字 …… 取り消せない操作（確認を挟む）
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Icon, type IconName } from "./Icon";

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="section">
      {title && <h2 className="section-title">{title}</h2>}
      <div className="list">{children}</div>
    </section>
  );
}

function Text({ label, description }: { label: ReactNode; description?: ReactNode }) {
  return (
    <span className="row-text">
      <span className="row-label">{label}</span>
      {description && <span className="row-desc">{description}</span>}
    </span>
  );
}

/** 見るだけの行（バージョンなど） */
export function InfoRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="row">
      <Text label={label} />
      <span className="row-value">{value}</span>
    </div>
  );
}

/** 押すとその場で実行する行 */
export function ActionRow({
  label,
  value,
  danger = false,
  disabled = false,
  onClick,
}: {
  label: ReactNode;
  value?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={danger ? "row row--action row--danger" : "row row--action"}
      onClick={onClick}
      disabled={disabled}
    >
      <Text label={label} />
      {value && <span className="row-value">{value}</span>}
    </button>
  );
}

/** 次の画面へ進む行（to）／アプリの外で開く行（href） */
export function LinkRow({
  label,
  value,
  to,
  href,
}: {
  label: ReactNode;
  value?: ReactNode;
  to?: string;
  href?: string;
}) {
  const inner = (
    <>
      <Text label={label} />
      {value && <span className="row-value">{value}</span>}
      <Icon name={href ? "external" : "forward"} size="sm" className="row-trail" />
    </>
  );
  return href ? (
    <a className="row row--link" href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <Link className="row row--link" to={to ?? "/"}>
      {inner}
    </Link>
  );
}

/** 右側に切り替えなどを置く行 */
export function ControlRow({
  label,
  description,
  children,
}: {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="row">
      <Text label={label} description={description} />
      {children}
    </div>
  );
}

/**
 * 2〜4個から1つ選ぶ。選んだものに藍の下線が付く。
 * icon を渡すとアイコンだけで並べる（名前は読み上げとツールチップに入る）。
 * アイコンで意味が伝わるものだけに使い、選んだものの名前は行の説明に出す。
 */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: IconName }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="choice" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const checked = value === o.value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={checked}
            aria-label={o.icon ? o.label : undefined}
            title={o.icon ? o.label : undefined}
            className={o.icon ? "choice-icon" : undefined}
            onClick={() => onChange(o.value)}
          >
            {o.icon ? <Icon name={o.icon} glass={checked} /> : o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className="switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-knob" />
    </button>
  );
}
