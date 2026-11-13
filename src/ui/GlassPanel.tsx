// 地の上に浮かぶガラスの札。画面でいちばん見てほしいまとまり（今月の合計と予算など）にだけ使う。
// 一覧や文章はガラスに入れず地に直接置く（同じ札を並べない）。ガラスの中にガラスは入れない。
import type { ReactNode } from "react";

export function GlassPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`panel fk-glass${className ? ` ${className}` : ""}`}>
      <div className="fk-glass-bd" />
      <div className="fk-glass-in">{children}</div>
    </section>
  );
}
