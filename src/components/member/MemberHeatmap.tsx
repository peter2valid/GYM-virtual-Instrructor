"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";

interface MemberHeatmapProps {
  dates: string[]; // YYYY-MM-DD
}

export function MemberHeatmap({ dates }: MemberHeatmapProps) {
  const dateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of dates) {
      counts[d] = (counts[d] ?? 0) + 1;
    }
    return counts;
  }, [dates]);

  // Generate grid: last 52 weeks + current week
  const grid = useMemo(() => {
    const weeks: { date: Date; count: number }[][] = [];
    const now = new Date();
    // Snap to Sunday of this week
    const current = new Date(now);
    current.setDate(now.getDate() - now.getDay());
    current.setHours(0, 0, 0, 0);

    // Go back 52 weeks
    const start = new Date(current);
    start.setDate(current.getDate() - 52 * 7);

    for (let w = 0; w < 53; w++) {
      const week: { date: Date; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const key = date.toISOString().split("T")[0];
        week.push({ date, count: dateCounts[key] ?? 0 });
      }
      weeks.push(week);
    }
    return weeks;
  }, [dateCounts]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; index: number }[] = [];
    let lastMonth = -1;
    grid.forEach((week, i) => {
      const month = week[0].date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: week[0].date.toLocaleString("default", { month: "short" }),
          index: i,
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [grid]);

  return (
    <div className="rounded-[2rem] bg-card p-6 shadow-badge ring-1 ring-border/5">
      <p className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">
        Activity Heatmap
      </p>

      <div className="relative overflow-x-auto pb-2 scrollbar-none">
        <div className="inline-flex flex-col gap-1.5 min-w-max">
          {/* Month labels */}
          <div className="flex text-[10px] text-muted-foreground h-4 mb-1">
            <div className="w-8 shrink-0" /> {/* Spacer for day labels */}
            {monthLabels.map((m, i) => (
              <div
                key={`${m.label}-${i}`}
                className="absolute"
                style={{ left: `${m.index * 13 + 32}px` }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] pr-2 text-[9px] text-muted-foreground/50 justify-between py-0.5 w-8 shrink-0">
              <span>Mon</span>
              <span className="invisible">Tue</span>
              <span>Wed</span>
              <span className="invisible">Thu</span>
              <span>Fri</span>
              <span className="invisible">Sat</span>
              <span>Sun</span>
            </div>

            {/* Grid */}
            <div className="flex gap-[3px]">
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      title={`${day.date.toDateString()}: ${day.count} workouts`}
                      className={cn(
                        "h-2.5 w-2.5 rounded-[2px] transition-colors",
                        day.count === 0 && "bg-muted/30",
                        day.count === 1 && "bg-primary/40",
                        day.count === 2 && "bg-primary/70",
                        day.count >= 3 && "bg-primary"
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="h-2.5 w-2.5 rounded-[2px] bg-muted/30" />
        <div className="h-2.5 w-2.5 rounded-[2px] bg-primary/40" />
        <div className="h-2.5 w-2.5 rounded-[2px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}
