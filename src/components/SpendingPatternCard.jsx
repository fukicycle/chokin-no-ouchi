import React, { useMemo, useState } from "react";
import { formatYenAxis } from "../utils/analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
// ヒートマップは1色(シアン)の濃淡で金額の大小を表す
const LEVEL_CLASSES = [
  "bg-slate-400/10 text-slate-500 dark:text-slate-400",
  "bg-cyan-500/20 text-slate-700 dark:text-slate-200",
  "bg-cyan-500/40 text-slate-800 dark:text-white",
  "bg-cyan-600/70 text-white",
  "bg-cyan-700 dark:bg-cyan-500 text-white",
];

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// 期間内で「今日まで」に含まれる日付の一覧
const elapsedDates = (viewMode, year, month, today) => {
  const start = viewMode === "month" ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
  const end = viewMode === "month" ? new Date(year, month, 0) : new Date(year, 11, 31);
  const last = end < today ? end : today;
  const dates = [];
  for (let d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) dates.push(new Date(d));
  return dates;
};

/**
 * 曜日別・日別の支出パターン (変動費のみ)。
 * 固定費は支払日が決まっているため、含めると特定の日・曜日が突出してしまうので除外する。
 */
const SpendingPatternCard = ({ expenses, viewMode = "month", year, month }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  const pattern = useMemo(() => {
    const today = new Date();
    const variable = expenses.filter((e) => !e.isFixed);

    const byDay = {};
    variable.forEach((e) => {
      const key = dayKey(new Date(e.date));
      if (!byDay[key]) byDay[key] = { total: 0, items: [] };
      byDay[key].total += e.amount || 0;
      byDay[key].items.push(e);
    });

    const dates = elapsedDates(viewMode, year, month, today);
    const weekdaySum = Array(7).fill(0);
    const weekdayCount = Array(7).fill(0);
    let noSpendDays = 0;
    let peak = null;
    dates.forEach((d) => {
      const total = byDay[dayKey(d)]?.total || 0;
      weekdaySum[d.getDay()] += total;
      weekdayCount[d.getDay()] += 1;
      if (total === 0) noSpendDays += 1;
      if (total > 0 && (!peak || total > peak.total)) peak = { date: d, total };
    });

    const weekdayData = WEEKDAYS.map((name, i) => ({
      name,
      平均: weekdayCount[i] > 0 ? Math.round(weekdaySum[i] / weekdayCount[i]) : 0,
    }));
    const topWeekday = weekdayData.reduce((a, b) => (b.平均 > a.平均 ? b : a), weekdayData[0]);

    return {
      byDay,
      weekdayData,
      topWeekday,
      noSpendDays,
      elapsedDays: dates.length,
      peak,
      maxDaily: Math.max(0, ...Object.values(byDay).map((d) => d.total)),
      hasData: variable.length > 0,
    };
  }, [expenses, viewMode, year, month]);

  const { byDay, weekdayData, topWeekday, noSpendDays, elapsedDays, peak, maxDaily, hasData } = pattern;

  // 月のカレンダー (先頭の空白セル + 各日)
  const calendarCells = useMemo(() => {
    if (viewMode !== "month") return [];
    const leading = new Date(year, month - 1, 1).getDay();
    const days = new Date(year, month, 0).getDate();
    return [
      ...Array(leading).fill(null),
      ...Array.from({ length: days }, (_, i) => new Date(year, month - 1, i + 1)),
    ];
  }, [viewMode, year, month]);

  const levelOf = (total) => {
    if (!total || !maxDaily) return 0;
    return Math.min(4, Math.ceil((total / maxDaily) * 4));
  };

  const today = new Date();
  const selected = selectedDay ? byDay[dayKey(selectedDay)] : null;

  return (
    <div className="w-full text-text-dark dark:text-gray-100">
      <h3 className="text-base font-bold mb-1 tracking-wide uppercase text-gray-500 dark:text-gray-400">
        支出のパターン ({viewMode === "month" ? "今月" : "今年"})
      </h3>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-4">固定費を除いた変動費で集計しています。</p>

      {!hasData ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
          支出を記録すると表示されます。
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-2.5 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-2xl">
              <span className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400">ノー支出デー</span>
              <span className="text-lg font-black text-slate-800 dark:text-white">{noSpendDays}日</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400"> / {elapsedDays}日</span>
            </div>
            <div className="px-3 py-2.5 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-2xl">
              <span className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400">よく使う曜日</span>
              <span className="text-lg font-black text-slate-800 dark:text-white">{topWeekday.name}曜日</span>
              <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                平均 ¥{topWeekday.平均.toLocaleString()}/日
              </span>
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              曜日別 1日あたりの平均支出
            </span>
            <div className="w-full h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="currentColor"
                    tick={{ fill: "currentColor", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    className="text-gray-500 dark:text-gray-400"
                  />
                  <YAxis
                    stroke="currentColor"
                    tick={{ fill: "currentColor", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={formatYenAxis}
                    className="text-gray-500 dark:text-gray-400"
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148,163,184,0.12)" }}
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.85)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelFormatter={(label) => `${label}曜日`}
                    formatter={(value) => [`¥${value.toLocaleString()}`, "1日平均"]}
                  />
                  <Bar dataKey="平均" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {viewMode === "month" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  日別カレンダー
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                  少
                  {LEVEL_CLASSES.map((cls, i) => (
                    <span key={i} className={`inline-block w-2.5 h-2.5 rounded-sm ${cls}`} />
                  ))}
                  多
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400">
                    {w}
                  </span>
                ))}
                {calendarCells.map((d, i) => {
                  if (!d) return <span key={`empty-${i}`} />;
                  const total = byDay[dayKey(d)]?.total || 0;
                  const isFuture = d > today;
                  const isSelected = selectedDay && dayKey(selectedDay) === dayKey(d);
                  return (
                    <button
                      key={d.getDate()}
                      type="button"
                      disabled={isFuture}
                      onClick={() => setSelectedDay(isSelected ? null : d)}
                      title={`${d.getMonth() + 1}/${d.getDate()} ¥${total.toLocaleString()}`}
                      className={`aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
                        isFuture ? "border border-dashed border-slate-400/25 text-slate-400/60" : LEVEL_CLASSES[levelOf(total)]
                      } ${isSelected ? "ring-2 ring-pink-500 dark:ring-pink-400" : ""}`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 px-3 py-2.5 bg-white/25 dark:bg-black/15 border border-white/30 dark:border-white/5 rounded-xl text-xs">
                {selectedDay ? (
                  <>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-300">
                        {selectedDay.getMonth() + 1}月{selectedDay.getDate()}日({WEEKDAYS[selectedDay.getDay()]})
                      </span>
                      <span className="font-black text-slate-800 dark:text-white">
                        ¥{(selected?.total || 0).toLocaleString()}
                      </span>
                    </div>
                    {selected ? (
                      <ul className="mt-1.5 space-y-0.5">
                        {selected.items.map((e) => (
                          <li key={e.id} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="truncate max-w-[65%]">
                              {e.category}
                              {e.description ? ` ・ ${e.description}` : ""}
                            </span>
                            <span>¥{(e.amount || 0).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">ノー支出デー 🎉</p>
                    )}
                  </>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 font-bold">
                    {peak
                      ? `最も使った日: ${peak.date.getMonth() + 1}月${peak.date.getDate()}日 ¥${peak.total.toLocaleString()}（日付をタップで内訳）`
                      : "日付をタップすると内訳を表示します"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpendingPatternCard;
