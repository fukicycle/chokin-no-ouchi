// 見ている期間の切り替え。各タブの中身の一番上に置く（どの期間の数字かを、数字より先に読めるように）。
// 前後の送りは左右の端、月・年の切り替えは右。
import { usePeriod } from "../data/period";
import { Icon } from "./Icon";
import { Choice } from "./List";

export function PeriodBar() {
  const p = usePeriod();
  return (
    <div className="period">
      <div className="period-nav">
        <button
          className="fk-icon-button fk-icon-button--flat"
          aria-label={p.mode === "month" ? "前の月" : "前の年"}
          onClick={p.prev}
        >
          <Icon name="back" size="sm" />
        </button>
        <span className="period-label">{p.label}</span>
        <button
          className="fk-icon-button fk-icon-button--flat"
          aria-label={p.mode === "month" ? "次の月" : "次の年"}
          onClick={p.next}
          disabled={!p.canGoNext}
        >
          <Icon name="forward" size="sm" />
        </button>
      </div>
      <Choice
        label="期間の単位"
        value={p.mode}
        options={[
          { value: "month", label: "月" },
          { value: "year", label: "年" },
        ]}
        onChange={p.setMode}
      />
    </div>
  );
}
