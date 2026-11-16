// きろく：月を暦で振り返り、あの日・あの支出を確かめて直す画面。
//
// なぜ暦か
// - 紙の家計簿が暦の形をしているのは、月のリズム（使いすぎた日・使わなかった日）が一目で分かるから。
//   このアプリは「今日の分」で暮らす考え方なので、その日の分に対してどうだったかを升ごとに見せる
// - 先の日付で記録される固定費（家賃など）も、その日の升に置かれるだけで、一覧の先頭に割り込まない
//
// 何をどこに置くか
// - 月の切り替えと暦は上に固定する。下をどこまで送っても「いま何月の・どこを見ているか」が見えていて、
//   そのまま別の日や月へ移れる（探す場所が決まっていればよい操作なので上側）
// - 下はスクロールする一覧。暦で選んでいるものによって中身が替わる
//   ・何も選んでいない：その月のまとめ（ふだん・固定費・使わなかった日、カテゴリーごとの合計）。
//     カテゴリーを押すと、そのカテゴリーの記録だけになり、暦は記録の無い日が薄くなる
//   ・日を押した：その日のメモ、その日の分に対してどうだったか、その日の記録。もう一度押すか × で、まとめに戻る
// - 日ごとのメモ（旅行・帰省・お祝いなど）：「なぜこの日は多かったか」を振り返るため。
//   書くのは日を選んだときだけ（その日を見ているときに書きたくなる）。記録より上に置く（その日の説明なので先に読む）。
//   月のまとめには「この月のメモ」を日付順に並べ、押すとその日へ。暦ではメモのある日に小さな線の印
// - 日を選んでいる間は、右下の［記録する］が「その日に記録」になる（AppShell）。書き忘れを後から入れる所
// - 行を押すと直せる（右端の › が押せる合図）
// - 月や選んだものを替えたら一覧は一番上から。タブを行き来しただけなら、見ていた位置のまま
// - 月を替えたとき、新しい月が届くまでは前の月を薄くして残す（空の画面を一瞬はさまない）
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useExpensesInRange } from "../data/hooks";
import { useDayNotes, type DayNote, type DayNotes } from "../data/notes";
import { usePlans } from "../data/plan";
import type { Expense } from "../data/types";
import { dayKey, formatDay, formatYen } from "../lib/format";
import { addMonths, monthRange, parseMonthKey, toMonthKey } from "../lib/months";
import { budgetOf, dailyShares, planFor, quietDays, sumAmount, type DayShare } from "../lib/savings";
import { dayKeyToDate, useToday } from "../lib/useToday";
import { Amount } from "../ui/Amount";
import { ExpenseRow } from "../ui/ExpenseRow";
import { Icon } from "../ui/Icon";
import { Calendar } from "./Calendar";
import { NoteSheet } from "./NoteSheet";
import { SPECIAL, useRecordsView, type Focus } from "./recordsView";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function RecordsScreen() {
  const todayKey = useToday();
  const { month, focus, showMonth, setFocus } = useRecordsView();
  const { year, month: m } = parseMonthKey(month);
  const { start, end } = monthRange(year, m);
  const { expenses, loading, refreshing } = useExpensesInRange(start, end);
  const { plans } = usePlans();
  const { value: notes } = useDayNotes(month);
  // メモのシート。seq は開くたびに増やす（前に打ちかけた内容を持ち越さない）
  const [noteTarget, setNoteTarget] = useState<{ seq: number; key: string } | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const openNote = (key: string) => {
    setNoteTarget((t) => ({ seq: (t?.seq ?? 0) + 1, key }));
    setNoteOpen(true);
  };
  const plan = planFor(plans, month);
  const isCurrent = month >= toMonthKey(dayKeyToDate(todayKey));

  const days = useMemo(
    () => dailyShares(plan ? budgetOf(plan) : null, expenses, year, m, dayKeyToDate(todayKey)),
    [plan, expenses, year, m, todayKey],
  );

  // 選んでいたカテゴリーがこの月に無ければ、まとめに戻す（暦の日も、この月の日でなければ外す）
  const shown: Focus =
    focus?.kind === "category"
      ? focus.name === SPECIAL
        ? expenses.some((e) => e.isSpecial)
          ? focus
          : null
        : expenses.some((e) => e.category === focus.name)
          ? focus
          : null
      : focus?.kind === "day" && focus.key.startsWith(month)
        ? focus
        : null;

  const inCategory = (e: Expense, name: string) =>
    name === SPECIAL ? Boolean(e.isSpecial) : e.category === name;
  const dimmed = useMemo(() => {
    if (shown?.kind !== "category") return null;
    const has = new Set(
      expenses.filter((e) => inCategory(e, shown.name)).map((e) => dayKey(new Date(e.date))),
    );
    return new Set(days.map((d) => d.key).filter((k) => !has.has(k)));
  }, [shown, expenses, days]);

  // 月や選んだものを替えたら、一覧を一番上から
  const list = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const focusKey = shown ? `${shown.kind}:${shown.kind === "day" ? shown.key : shown.name}` : "";
  useLayoutEffect(() => {
    if (first.current) first.current = false;
    else list.current?.scrollTo({ top: 0 });
  }, [month, focusKey]);

  const pickDay = (key: string) =>
    setFocus(shown?.kind === "day" && shown.key === key ? null : { kind: "day", key });

  return (
    <div className="page records">
      <div className="records-head">
        <div className="monthbar">
          <h2 className="monthbar-label">
            {year}年{m}月
          </h2>
          <button
            className="fk-icon-button"
            aria-label="前の月"
            onClick={() => showMonth(addMonths(month, -1))}
          >
            <Icon name="back" />
          </button>
          <button
            className="fk-icon-button"
            aria-label="次の月"
            disabled={isCurrent}
            onClick={() => showMonth(addMonths(month, 1))}
          >
            <Icon name="forward" />
          </button>
        </div>
        <Calendar
          year={year}
          month={m}
          days={days}
          selected={shown?.kind === "day" ? shown.key : null}
          dimmed={dimmed}
          noted={notes}
          loading={loading}
          onPick={pickDay}
        />
      </div>

      <div ref={list} className="records-list fk-scroll" data-scroll-top>
        <div className={refreshing ? "records-body is-refreshing" : "records-body"}>
          {shown?.kind === "day" ? (
            <DayView
              day={days.find((d) => d.key === shown.key)!}
              expenses={expenses}
              note={notes[shown.key]}
              onNote={() => openNote(shown.key)}
              onClose={() => setFocus(null)}
            />
          ) : shown?.kind === "category" ? (
            <CategoryView
              name={shown.name}
              expenses={expenses.filter((e) => inCategory(e, shown.name))}
              onClose={() => setFocus(null)}
            />
          ) : (
            <MonthView
              month={m}
              days={days}
              expenses={expenses}
              loading={loading}
              hasPlan={plan !== null}
              notes={notes}
              onCategory={(name) => setFocus({ kind: "category", name })}
              onDay={(key) => setFocus({ kind: "day", key })}
            />
          )}
        </div>
      </div>

      {noteTarget && (
        <NoteSheet
          key={noteTarget.seq}
          dayKey={noteTarget.key}
          label={dayLabel(noteTarget.key)}
          note={notes[noteTarget.key]}
          open={noteOpen}
          onClose={() => setNoteOpen(false)}
        />
      )}
    </div>
  );
}

/** 「11月14日（土）」 */
const dayLabel = (key: string) => {
  const d = dayKeyToDate(key);
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
};

/** 何も選んでいないとき：その月のまとめ */
function MonthView({
  month,
  days,
  expenses,
  loading,
  hasPlan,
  notes,
  onCategory,
  onDay,
}: {
  month: number;
  days: DayShare[];
  expenses: Expense[];
  loading: boolean;
  hasPlan: boolean;
  notes: DayNotes;
  onCategory: (name: string) => void;
  onDay: (key: string) => void;
}) {
  const memos = Object.entries(notes).sort(([a], [b]) => a.localeCompare(b));
  const normal = sumAmount(expenses.filter((e) => !e.isFixed && !e.isSpecial));
  const fixed = sumAmount(expenses.filter((e) => e.isFixed && !e.isSpecial));
  const special = sumAmount(expenses.filter((e) => e.isSpecial));
  const passed = days.filter((d) => d.when === "past").length;
  // カテゴリーごとの合計（特別費は別に一行）。多い順
  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) {
      if (e.isSpecial) continue;
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);
  const top = Math.max(1, ...categories.map(([, v]) => v), special);

  return (
    <section className="view" aria-label={`${month}月のまとめ`}>
      <div className="view-head">
        <h3 className="view-title">{month}月のまとめ</h3>
        <span className="view-total">
          <Amount value={sumAmount(expenses)} loading={loading} />
        </span>
      </div>
      <dl className="month-sums">
        <div>
          <dt>ふだん</dt>
          <dd>
            <Amount value={normal} loading={loading} />
          </dd>
        </div>
        <div>
          <dt>固定費</dt>
          <dd>
            <Amount value={fixed} loading={loading} />
          </dd>
        </div>
        <div>
          <dt>
            <i className="ring-mark" aria-hidden="true" />
            使わなかった日
          </dt>
          <dd>{loading ? "　" : passed === 0 ? "—" : `${quietDays(days)}日`}</dd>
        </div>
      </dl>

      {memos.length > 0 && (
        <>
          <h4 className="sub-title">この月のメモ</h4>
          <ul className="memos">
            {memos.map(([key, n]) => (
              <li key={key}>
                <button className="memo" onClick={() => onDay(key)}>
                  <span className="memo-day">{Number(key.slice(8))}日</span>
                  <span className="memo-text">{n.text}</span>
                  <Icon name="forward" size="sm" className="row-go" />
                </button>
              </li>
            ))}
          </ul>
          <h4 className="sub-title">カテゴリー</h4>
        </>
      )}

      {categories.length > 0 && (
        <ul className="cats" aria-label="カテゴリーごとの合計">
          {categories.map(([name, total]) => (
            <li key={name}>
              <button className="cat" onClick={() => onCategory(name)}>
                <span className="cat-name">{name}</span>
                <span className="cat-amount">{formatYen(total)}</span>
                <Icon name="forward" size="sm" className="row-go" />
                <span className="cat-bar" style={{ width: `${(total / top) * 100}%` }} />
              </button>
            </li>
          ))}
          {special > 0 && (
            <li>
              <button className="cat cat--special" onClick={() => onCategory(SPECIAL)}>
                <span className="cat-name">特別費</span>
                <span className="cat-amount">{formatYen(special)}</span>
                <Icon name="forward" size="sm" className="row-go" />
                <span className="cat-bar" style={{ width: `${(special / top) * 100}%` }} />
              </button>
            </li>
          )}
        </ul>
      )}
      {!loading && expenses.length === 0 && <p className="quiet">この月の記録はありません</p>}

      <p className="cal-legend">
        <span>
          <i className="legend-fill" aria-hidden="true" />
          {hasPlan ? "升の色はその日の分に対して使った割合" : "升の色はその月でいちばん使った日に対する割合"}
        </span>
        <span>
          <i className="cal-mark cal-mark--fixed" aria-hidden="true" />
          固定費
        </span>
        <span>
          <i className="cal-mark cal-mark--special" aria-hidden="true" />
          特別費
        </span>
        <span>
          <i className="cal-mark cal-mark--note" aria-hidden="true" />
          メモ
        </span>
      </p>
    </section>
  );
}

/** 日を選んだとき：その日の記録と、その日の分に対してどうだったか */
function DayView({
  day,
  expenses,
  note: memo,
  onNote,
  onClose,
}: {
  day: DayShare;
  expenses: Expense[];
  note: DayNote | undefined;
  onNote: () => void;
  onClose: () => void;
}) {
  const items = expenses.filter((e) => dayKey(new Date(e.date)) === day.key);
  const date = dayKeyToDate(day.key);
  const word = day.when === "today" ? "今日" : "この日";
  const verdict =
    day.when === "future"
      ? "まだ先の日です"
      : day.share === null
        ? "　"
        : day.normal === 0
          ? day.when === "today"
            ? `今日の分は ${formatYen(day.share)}。まだ使っていません`
            : "ふだんの支出はありませんでした"
          : day.normal <= day.share
            ? `${word}の分 ${formatYen(day.share)} の中でした`
            : `${word}の分 ${formatYen(day.share)} を ${formatYen(day.normal - day.share)} こえました`;
  return (
    <section className="view" aria-label={`${date.getMonth() + 1}月${date.getDate()}日の記録`}>
      <div className="view-head">
        <h3 className="view-title">
          {date.getMonth() + 1}月{date.getDate()}日（{WEEKDAYS[date.getDay()]}）
        </h3>
        <span className="view-total">{formatYen(sumAmount(items))}</span>
        <button
          className="fk-icon-button fk-icon-button--flat view-close"
          aria-label="月のまとめに戻る"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      {memo ? (
        <button className="day-memo" onClick={onNote} aria-label={`この日のメモを直す：${memo.text}`}>
          <span className="day-memo-text">{memo.text}</span>
          <Icon name="edit" size="sm" />
        </button>
      ) : (
        <button className="day-memo-add" onClick={onNote}>
          <Icon name="edit" size="sm" />
          この日のメモを書く
        </button>
      )}
      <p className={day.share !== null && day.normal > day.share ? "view-note is-over" : "view-note"}>
        {verdict}
      </p>
      {items.length > 0 ? (
        <ul className="expenses">
          {items.map((e) => (
            <ExpenseRow key={e.id} expense={e} />
          ))}
        </ul>
      ) : (
        <p className="quiet">この日の記録はありません</p>
      )}
    </section>
  );
}

/** カテゴリーを選んだとき：そのカテゴリーの記録を日ごとに */
function CategoryView({
  name,
  expenses,
  onClose,
}: {
  name: string;
  expenses: Expense[];
  onClose: () => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const key = dayKey(new Date(e.date));
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()];
  }, [expenses]);
  return (
    <section className="view" aria-label={`${name === SPECIAL ? "特別費" : name}の記録`}>
      <div className="view-head">
        <h3 className="view-title">{name === SPECIAL ? "特別費" : name}</h3>
        <span className="view-total">{formatYen(sumAmount(expenses))}</span>
        <button
          className="fk-icon-button fk-icon-button--flat view-close"
          aria-label="月のまとめに戻る"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="view-note">
        {groups.length}日で{expenses.length}件
      </p>
      {groups.map(([key, items]) => (
        <div key={key} className="day">
          <div className="day-head">
            <h4 className="day-title">{formatDay(key)}</h4>
            <span className="day-total">{formatYen(sumAmount(items))}</span>
          </div>
          <ul className="expenses">
            {items.map((e) => (
              <ExpenseRow key={e.id} expense={e} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
