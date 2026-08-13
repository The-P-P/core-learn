import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyStat } from "../db/types";
import { chartColors } from "../lib/css-vars";
import {
  deriveWeeklyInsights,
  formatWeekLabel,
  formatWeekLong,
  trendLabel,
} from "../lib/weekly-insights";
import { useThemeStore } from "../stores/theme";

interface WeeklyChartProps {
  data: WeeklyStat[];
  ctaHref?: string;
}

type ChartRow = WeeklyStat & { label: string; isCurrent: boolean };

function CustomTooltip({
  active,
  payload,
  colors,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
  colors: ReturnType<typeof chartColors>;
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  return (
    <div
      className="rounded-[var(--radius-md)] border px-3 py-2 shadow-sm"
      style={{
        background: colors.surface,
        borderColor: colors.grid,
        color: colors.fg,
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
        Semana de {formatWeekLong(row.week_start)}
      </p>
      <p className="mt-1 font-serif text-sm font-semibold">
        {row.count} {row.count === 1 ? "tópico" : "tópicos"}
      </p>
    </div>
  );
}

function ValueLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
  fill?: string;
}) {
  const { x = 0, y = 0, width = 0, value = 0, fill } = props;
  if (!value || value <= 0) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill={fill}
      textAnchor="middle"
      fontSize={11}
      fontFamily="IBM Plex Mono, ui-monospace, monospace"
    >
      {value}
    </text>
  );
}

export function WeeklyChart({ data, ctaHref = "/" }: WeeklyChartProps) {
  const accent = useThemeStore((s) => s.accent);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const [colors, setColors] = useState(() => chartColors());

  useEffect(() => {
    setColors(chartColors());
  }, [accent]);

  const insights = useMemo(() => deriveWeeklyInsights(data), [data]);

  const chartData: ChartRow[] = useMemo(
    () =>
      data.map((w, i) => ({
        ...w,
        label: formatWeekLabel(w.week_start),
        isCurrent: i === data.length - 1,
      })),
    [data],
  );

  const yMax = Math.max(4, insights.max);
  const animate = !reducedMotion;
  const sparse = insights.total > 0 && insights.activeWeeks <= 2;
  const trend = trendLabel(insights.trend);

  const ghostFill = `color-mix(in srgb, ${colors.accent} 18%, transparent)`;
  const normalFill = `color-mix(in srgb, ${colors.accent} 72%, transparent)`;
  const currentFill = colors.accent;
  const areaFill = `color-mix(in srgb, ${colors.accent} 14%, transparent)`;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold">
            Concluídos por semana
          </h2>
          <p className="mt-1 text-sm text-muted">Últimas 8 semanas</p>
        </div>
        {insights.total > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted">
            <span>
              <span className="text-fg">{insights.total}</span> total
            </span>
            <span>
              <span className="text-fg">{insights.avg}</span> / sem
            </span>
            {insights.best && (
              <span>
                melhor{" "}
                <span className="text-accent">{insights.best.label}</span>
              </span>
            )}
            {trend && <span className="text-accent">{trend}</span>}
          </div>
        )}
      </div>

      {insights.total === 0 ? (
        <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-10 text-center">
          <p className="font-serif text-lg font-semibold text-fg">
            Ainda sem conclusões nas últimas 8 semanas.
          </p>
          <p className="mt-2 text-sm text-muted">
            Marque tópicos nas matérias — o ritmo aparece aqui.
          </p>
          <Link
            to={ctaHref}
            className="mt-4 inline-block font-mono text-[11px] uppercase tracking-wider text-accent underline-offset-2 hover:underline"
          >
            Ir às matérias
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 h-64 rounded-[var(--radius-lg)] border border-border bg-surface p-3">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 18, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.grid}
                  vertical={false}
                  strokeOpacity={0.7}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: colors.muted }}
                  stroke={colors.grid}
                  tickLine={false}
                  axisLine={{ stroke: colors.grid }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, yMax]}
                  tick={{ fontSize: 11, fill: colors.muted }}
                  stroke={colors.grid}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: `color-mix(in srgb, ${colors.accent} 8%, transparent)` }}
                  content={<CustomTooltip colors={colors} />}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  fill={areaFill}
                  stroke="none"
                  isAnimationActive={animate}
                  animationDuration={600}
                />
                <Bar
                  dataKey="count"
                  name="Tópicos"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  minPointSize={4}
                  isAnimationActive={animate}
                  animationDuration={600}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.week_start}
                      fill={
                        entry.count === 0
                          ? ghostFill
                          : entry.isCurrent
                            ? currentFill
                            : normalFill
                      }
                      stroke={entry.isCurrent ? colors.accent : "transparent"}
                      strokeWidth={entry.isCurrent ? 1 : 0}
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    content={<ValueLabel fill={colors.muted} />}
                  />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {sparse && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
              Poucas semanas com atividade — o gráfico fica mais rico conforme
              você avança.
            </p>
          )}
        </>
      )}
    </section>
  );
}
