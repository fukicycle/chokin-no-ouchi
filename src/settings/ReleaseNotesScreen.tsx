import { Notes } from "../ui/Notes";
import { UpdateNotice } from "../update/UpdateNotice";
import { useUpdate } from "../update/UpdateProvider";

/** これまでの版ごとの変更（新しい順）。まだ入れていない新しい版があれば一番上に出す */
export function ReleaseNotesScreen() {
  const { latest, current } = useUpdate();
  return (
    <div className="page">
      <ol className="history">
        {latest && (
          <li className="history-item">
            <UpdateNotice info={latest} />
          </li>
        )}
        {__RELEASE_NOTES__.map((n) => (
          <li key={n.version} className="history-item">
            <p className="history-head">
              <span className="history-version">v{n.version}</span>
              {n.date && <span className="history-date">{n.date}</span>}
              {n.version === current.version && <span className="history-current">いま使っている版</span>}
            </p>
            <Notes items={n.items} />
          </li>
        ))}
      </ol>
    </div>
  );
}
