import type { WeeklyStat } from "../db/types";

export type Trend = "up" | "down" | "flat" | "none";

export interface WeeklyInsights {
  total: number;
  avg: number;
  best: { week_start: string; count: number; label: string } | null;
  trend: Trend;
  activeWeeks: number;
  max: number;
}

export function formatWeekLabel(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatWeekLong(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function deriveWeeklyInsights(weekly: WeeklyStat[]): WeeklyInsights {
  const total = weekly.reduce((sum, w) => sum + w.count, 0);
  const weeks = weekly.length || 8;
  const avg = Math.round((total / weeks) * 10) / 10;
  const activeWeeks = weekly.filter((w) => w.count > 0).length;
  const max = weekly.reduce((m, w) => Math.max(m, w.count), 0);

  let best: WeeklyInsights["best"] = null;
  if (max > 0) {
    const row = weekly.find((w) => w.count === max)!;
    best = {
      week_start: row.week_start,
      count: row.count,
      label: formatWeekLabel(row.week_start),
    };
  }

  let trend: Trend = "none";
  if (total > 0 && weekly.length >= 4) {
    const mid = Math.floor(weekly.length / 2);
    const earlier = weekly.slice(0, mid).reduce((s, w) => s + w.count, 0);
    const recent = weekly.slice(mid).reduce((s, w) => s + w.count, 0);
    if (recent > earlier) trend = "up";
    else if (recent < earlier) trend = "down";
    else trend = "flat";
  }

  return { total, avg, best, trend, activeWeeks, max };
}

export function trendLabel(trend: Trend): string | null {
  switch (trend) {
    case "up":
      return "↑ ritmo subindo";
    case "down":
      return "↓ ritmo caindo";
    case "flat":
      return "→ estável";
    default:
      return null;
  }
}
