import type { WorkSystem } from "./types";

export interface Mastery {
  level: number;
  passes: number;
  nextAt: number | null;
  progress: number;
}

const thresholds = [0, 1, 3, 6, 10];

export function masteryOf(system: WorkSystem): Mastery {
  const passes = system.runs.filter((run) => run.verdict !== "rework").length;
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i -= 1) {
    if (passes >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  const nextAt = level < thresholds.length ? thresholds[level] : null;
  const floor = thresholds[level - 1];
  const progress = nextAt === null ? 1 : Math.max(0, Math.min(1, (passes - floor) / (nextAt - floor)));
  return { level, passes, nextAt, progress };
}

export function savedMinutes(system: WorkSystem): number {
  const { minutesPerTask, repeatsPerMonth, savingsRate } = system.sim;
  const minutes = minutesPerTask * repeatsPerMonth * (savingsRate / 100);
  return Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
}

export function formatDuration(minutes: number, locale: "ko" | "en"): string {
  if (minutes < 60) return locale === "ko" ? `${minutes}분` : `${minutes} min`;
  const hours = minutes / 60;
  const rounded = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return locale === "ko" ? `${rounded}시간` : `${rounded} h`;
}

export function relativeDay(at: number, locale: "ko" | "en"): string {
  const diff = Date.now() - at;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return locale === "ko" ? "방금" : "just now";
  if (minutes < 60) return locale === "ko" ? `${minutes}분 전` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return locale === "ko" ? `${hours}시간 전` : `${hours} h ago`;
  const days = Math.round(hours / 24);
  return locale === "ko" ? `${days}일 전` : `${days} d ago`;
}

export function dateLabel(at: number, locale: "ko" | "en"): string {
  const d = new Date(at);
  return locale === "ko"
    ? `${d.getMonth() + 1}월 ${d.getDate()}일`
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
