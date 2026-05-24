import { addDays, differenceInCalendarDays, format, isAfter, parseISO, startOfDay } from "date-fns";

export type CycleLog = {
  id: string;
  periodStart: string;
  periodEnd?: string;
};

export type DailyLog = {
  date: string;
  flow: "none" | "spotting" | "light" | "medium" | "heavy";
  mood: string;
  symptoms: string[];
  notes?: string;
};

export type RhythmLog = {
  date: string;
  energy: number;
  sleep: number;
  mood: string;
  symptoms: string[];
};

export type Phase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal";

export type Prediction = {
  nextPeriods: string[];
  ovulationDate: string;
  pmsStart: string;
  confidence: "High" | "Medium" | "Low";
  irregular: boolean;
  range?: { start: string; end: string };
  averageCycleLength: number;
  averagePeriodDuration: number;
};

export const phaseColors: Record<Phase, string> = {
  Menstrual: "#F4A7B9",
  Follicular: "#A8D8EA",
  Ovulation: "#FFF1A8",
  Luteal: "#C3B1E1"
};

export function todayKey(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function getCycleLengths(logs: CycleLog[]) {
  const starts = [...logs]
    .map((log) => parseISO(log.periodStart))
    .sort((a, b) => a.getTime() - b.getTime());

  return starts
    .slice(1)
    .map((start, index) => differenceInCalendarDays(start, starts[index]))
    .filter((length) => length >= 15 && length <= 60);
}

export function getAverage(values: number[], fallback: number) {
  if (!values.length) return fallback;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function getStandardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function predictCycle(logs: CycleLog[], fallbackCycleLength = 28, fallbackPeriodDuration = 5): Prediction {
  const sorted = [...logs].sort((a, b) => parseISO(a.periodStart).getTime() - parseISO(b.periodStart).getTime());
  const lengths = getCycleLengths(sorted).slice(-6);
  const averageCycleLength = getAverage(lengths, fallbackCycleLength);
  const periodDurations = sorted
    .map((log) => {
      if (!log.periodEnd) return fallbackPeriodDuration;
      return differenceInCalendarDays(parseISO(log.periodEnd), parseISO(log.periodStart)) + 1;
    })
    .filter((duration) => duration > 0 && duration <= 12);
  const averagePeriodDuration = getAverage(periodDurations, fallbackPeriodDuration);
  const lastStart = sorted.length ? parseISO(sorted[sorted.length - 1].periodStart) : startOfDay(new Date());
  const confidence = lengths.length >= 4 ? "High" : lengths.length >= 2 ? "Medium" : "Low";
  const irregular = getStandardDeviation(lengths) > 7;
  const today = startOfDay(new Date());
  let nextPeriodDate = addDays(lastStart, averageCycleLength);
  while (differenceInCalendarDays(nextPeriodDate, today) < 0) {
    nextPeriodDate = addDays(nextPeriodDate, averageCycleLength);
  }

  const nextPeriods = [0, 1, 2].map((offset) => format(addDays(nextPeriodDate, averageCycleLength * offset), "yyyy-MM-dd"));
  let ovulationDate = addDays(nextPeriodDate, -14);
  if (differenceInCalendarDays(ovulationDate, today) < 0) {
    ovulationDate = addDays(nextPeriodDate, averageCycleLength - 14);
  }
  let pmsStart = addDays(nextPeriodDate, -7);
  if (differenceInCalendarDays(pmsStart, today) < 0) {
    pmsStart = addDays(nextPeriodDate, averageCycleLength - 7);
  }

  return {
    nextPeriods,
    ovulationDate: format(ovulationDate, "yyyy-MM-dd"),
    pmsStart: format(pmsStart, "yyyy-MM-dd"),
    confidence,
    irregular,
    range: irregular
      ? {
          start: format(addDays(nextPeriodDate, -4), "yyyy-MM-dd"),
          end: format(addDays(nextPeriodDate, 4), "yyyy-MM-dd")
        }
      : undefined,
    averageCycleLength,
    averagePeriodDuration
  };
}

export function getCurrentPhase(logs: CycleLog[], prediction: Prediction, date = new Date()) {
  const sorted = [...logs].sort((a, b) => parseISO(a.periodStart).getTime() - parseISO(b.periodStart).getTime());
  const lastStart = sorted.length ? parseISO(sorted[sorted.length - 1].periodStart) : date;
  const day = Math.max(1, differenceInCalendarDays(startOfDay(date), lastStart) + 1);
  const ovulationDay = Math.max(1, prediction.averageCycleLength - 14);
  let phase: Phase = "Luteal";

  if (day <= prediction.averagePeriodDuration) {
    phase = "Menstrual";
  } else if (day < ovulationDay - 2) {
    phase = "Follicular";
  } else if (day <= ovulationDay + 2) {
    phase = "Ovulation";
  }

  return {
    phase,
    day,
    progress: Math.min(100, Math.round((day / prediction.averageCycleLength) * 100))
  };
}

export function daysUntil(date: string, from = new Date()) {
  return differenceInCalendarDays(parseISO(date), startOfDay(from));
}

export function formatDate(date: string) {
  return format(parseISO(date), "MMM d");
}

export function isLate(prediction: Prediction, date = new Date()) {
  return isAfter(startOfDay(date), addDays(parseISO(prediction.nextPeriods[0]), 7));
}

export function calendarDays(monthDate = new Date()) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const offset = first.getDay();
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}
