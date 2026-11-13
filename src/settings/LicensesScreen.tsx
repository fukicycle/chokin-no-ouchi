import config from "../../app.config";
import { Icon } from "../ui/Icon";
import { Section } from "../ui/List";

/**
 * このアプリと、含まれているライブラリのライセンス（ビルド時に node_modules から集める）。
 * 全文は長いので、名前の行を押したときだけ開く。
 */
export function LicensesScreen() {
  return (
    <div className="page">
      <Section title="このアプリ">
        <div className="row">
          <span className="row-label">{config.license}</span>
        </div>
      </Section>
      <Section title="使っているライブラリ">
        {__LICENSES__.map((l) => (
          <details key={l.name} className="license">
            <summary className="row row--link">
              <span className="row-text">
                <span className="row-label">{l.name}</span>
              </span>
              <span className="row-value">{l.license}</span>
              <Icon name="forward" size="sm" className="row-trail license-chevron" />
            </summary>
            <pre className="license-text">{l.text}</pre>
          </details>
        ))}
      </Section>
    </div>
  );
}
