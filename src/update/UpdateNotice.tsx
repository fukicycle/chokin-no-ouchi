// 新しい版のお知らせの中身。通知一覧・設定・リリースノートで同じものを使う。
// 囲み（カード）は置く側が決める。ここは「何が変わるか」と［更新する］だけ。
// リリースノートを読んでから押せるよう、ボタンは一番下（親指の届く側）に置く。
import type { VersionInfo } from "../lib/releaseNotes";
import { Notes } from "../ui/Notes";
import { useUpdate } from "./UpdateProvider";

export function UpdateNotice({ info }: { info: VersionInfo }) {
  const { apply, applying } = useUpdate();
  return (
    <div className="update">
      <p className="update-head">
        <span className="update-title">新しい版 v{info.version}</span>
        {info.date && <span className="update-date">{info.date}</span>}
      </p>
      {info.notes.length > 0 && <Notes items={info.notes} />}
      <button className="fk-button fk-button--primary fk-button--block" onClick={apply} disabled={applying}>
        {applying ? "切り替えています…" : "更新する"}
      </button>
    </div>
  );
}
