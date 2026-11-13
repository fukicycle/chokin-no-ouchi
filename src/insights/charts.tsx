// 分析のグラフ。色は差し色ひとつを基本にし、補助の線は文字の色の濃淡と線の形（破線・点線）で分ける。
// 凡例は図の下に、線の形と一緒に置く（色だけで見分けさせない）。
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatYen, formatYenAxis } from "../lib/analytics";
import type { ThemeColors } from "../ui/useThemeColors";

const tooltipStyle = (c: ThemeColors) => ({
  contentStyle: {
    background: c.ink,
    border: "none",
    borderRadius: 12,
    color: c.ground,
    fontSize: 13,
  },
  itemStyle: { color: c.ground },
  labelStyle: { color: c.ground, fontWeight: 700 },
});

const axis = (c: ThemeColors) => ({
  stroke: c.muted,
  tick: { fill: c.muted, fontSize: 11 },
  axisLine: false,
  tickLine: false,
});

export function TrendChart({
  data,
  budget,
  average,
  colors,
}: {
  data: { label: string; total: number | null }[];
  budget: number;
  average: number | null;
  colors: ThemeColors;
}) {
  return (
    <figure className="chart">
      <div className="chart-plot" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={colors.hair} vertical={false} />
            <XAxis dataKey="label" {...axis(colors)} interval="preserveStartEnd" />
            {/* 支出の線は差し色のグラデーション（小判色→桜色） */}
            <defs>
              <linearGradient id="trend-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={colors.accent} />
                <stop offset="100%" stopColor={colors.accent2} />
              </linearGradient>
            </defs>
            <YAxis {...axis(colors)} width={44} tickFormatter={formatYenAxis} />
            <Tooltip
              {...tooltipStyle(colors)}
              cursor={{ stroke: colors.muted, strokeDasharray: "2 3" }}
              formatter={(v) => [v == null ? "--" : formatYen(Number(v)), "支出"]}
            />
            {budget > 0 && (
              <ReferenceLine
                y={budget}
                stroke={colors.muted}
                strokeDasharray="6 4"
                strokeWidth={1.5}
                ifOverflow="extendDomain"
              />
            )}
            {average !== null && (
              <ReferenceLine y={average} stroke={colors.ink} strokeDasharray="2 3" strokeWidth={1.2} />
            )}
            <Line
              type="monotone"
              dataKey="total"
              stroke="url(#trend-stroke)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: colors.accent, stroke: colors.ground, strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: colors.ground, strokeWidth: 2 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="legend">
        <span className="legend-item">
          <span className="legend-line legend-line--gradient" />
          支出
        </span>
        {budget > 0 && (
          <span className="legend-item">
            <span className="legend-line" style={{ borderColor: colors.muted, borderTopStyle: "dashed" }} />
            予算 {formatYen(budget)}
          </span>
        )}
        {average !== null && (
          <span className="legend-item">
            <span className="legend-line" style={{ borderColor: colors.ink, borderTopStyle: "dotted" }} />
            平均 {formatYen(average)}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

export function WeekdayChart({
  data,
  colors,
}: {
  data: { name: string; average: number }[];
  colors: ThemeColors;
}) {
  return (
    <figure className="chart">
      <div className="chart-plot" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={colors.hair} vertical={false} />
            <XAxis dataKey="name" {...axis(colors)} />
            <YAxis {...axis(colors)} width={44} tickFormatter={formatYenAxis} />
            <Tooltip
              {...tooltipStyle(colors)}
              cursor={{ fill: colors.hair }}
              labelFormatter={(l) => `${l}曜日`}
              formatter={(v) => [formatYen(Number(v)), "1日平均"]}
            />
            <defs>
              <linearGradient id="weekday-fill" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={colors.accent} />
                <stop offset="100%" stopColor={colors.accent2} />
              </linearGradient>
            </defs>
            <Bar dataKey="average" fill="url(#weekday-fill)" radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
