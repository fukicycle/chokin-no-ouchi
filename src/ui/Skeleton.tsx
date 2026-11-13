// 最初の読み込みのあいだ、中身とほぼ同じ形の薄い面を置いておく。
// 届いたときに画面がガクンと伸び縮みしないようにするため。動き続ける光（シマー）は付けない（DESIGN.md 6）
export function SkeletonLines({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="skeleton-row">
          <span className="skeleton-bar" style={{ width: `${40 + ((i * 23) % 35)}%` }} />
          <span className="skeleton-bar skeleton-bar--short" />
        </span>
      ))}
    </div>
  );
}
