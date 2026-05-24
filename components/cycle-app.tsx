"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameMonth, isToday } from "date-fns";
import {
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Copy,
  Download,
  HeartHandshake,
  Home,
  KeyRound,
  Lock,
  LogOut,
  MessageCircle,
  Plus,
  Settings,
  Shield,
  Sparkles,
  SunMedium,
  Unlock,
  UserRound,
} from "lucide-react";
import clsx from "clsx";
import { useCycleStore, type CycleState } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import {
  calendarDays,
  daysUntil,
  formatDate,
  getCurrentPhase,
  phaseColors,
  predictCycle,
  todayKey,
  type CycleLog,
  type DailyLog,
  type RhythmLog,
} from "@/lib/cycle";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "ai", label: "Ask AI", icon: MessageCircle },
  { id: "partner", label: "Partner", icon: HeartHandshake },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const moodOptions = [
  { key: "happy", emoji: "😊", label: "Happy" },
  { key: "calm", emoji: "😌", label: "Calm" },
  { key: "energized", emoji: "⚡", label: "Energized" },
  { key: "anxious", emoji: "😰", label: "Anxious" },
  { key: "irritable", emoji: "😤", label: "Irritable" },
  { key: "sad", emoji: "😢", label: "Sad" },
] as const;

const symptomOptions = [
  { key: "cramps", emoji: "🔴", label: "Cramps" },
  { key: "bloating", emoji: "🎈", label: "Bloating" },
  { key: "headache", emoji: "🤕", label: "Headache" },
  { key: "fatigue", emoji: "😴", label: "Fatigue" },
  { key: "acne", emoji: "💢", label: "Acne" },
  { key: "breast tenderness", emoji: "💗", label: "Breast tenderness" },
] as const;

const flowOptions = [
  { key: "none", emoji: "⭕", label: "None" },
  { key: "spotting", emoji: "🩷", label: "Spotting" },
  { key: "light", emoji: "💧", label: "Light" },
  { key: "medium", emoji: "💧💧", label: "Medium" },
  { key: "heavy", emoji: "💧💧💧", label: "Heavy" },
] as const;
type TabId = (typeof tabs)[number]["id"];

export default function CycleApp() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const store = useCycleStore();

  useEffect(() => {
    useCycleStore.persist.rehydrate();
  }, []);

  const prediction = useMemo(
    () => predictCycle(store.cycleLogs),
    [store.cycleLogs],
  );
  const current = useMemo(
    () => getCurrentPhase(store.cycleLogs, prediction),
    [store.cycleLogs, prediction],
  );
  const todayLog = store.dailyLogs.find((log) => log.date === todayKey()) ?? {
    date: todayKey(),
    flow: "none",
    mood: "calm",
    symptoms: [],
  };
  const todayRhythm = store.rhythmLogs.find(
    (log) => log.date === todayKey(),
  ) ?? {
    date: todayKey(),
    energy: 3,
    sleep: 3,
    mood: "steady",
    symptoms: [],
  };
  const accent = phaseColors[current.phase];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 pb-28 pt-3 sm:px-6 sm:pt-5 lg:pb-8">
      <header className="mb-3 flex items-center justify-end gap-2 rounded-[1.25rem] border border-white/70 bg-white/48 px-3 py-3 shadow-soft backdrop-blur sm:mb-4 sm:px-4">
        <span className="mr-auto text-sm font-semibold text-berry/70">
          Cycle
        </span>
        <div className="flex items-center gap-3">
          <button
            className="grid h-11 w-11 place-items-center rounded-2xl border border-rose/20 bg-white/70"
            aria-label="Notifications"
          >
            <Bell size={20} aria-hidden="true" />
          </button>
          <button
            className="grid h-11 w-11 place-items-center rounded-2xl bg-berry text-white sm:w-auto sm:px-4"
            aria-label="Sign out"
            onClick={signOut}
          >
            <LogOut size={18} aria-hidden="true" />
            <span className="hidden sm:ml-2 sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0">
          {activeTab === "home" && (
            <HomeView
              accent={accent}
              current={current}
              prediction={prediction}
              displayName={store.displayName}
              todayLog={todayLog}
              todayRhythm={todayRhythm}
              trackingMode={store.trackingMode}
              cycleLogs={store.cycleLogs}
              onPeriodStart={store.addPeriodStart}
              onPeriodEnd={store.endCurrentPeriod}
              onDailyLog={store.updateDailyLog}
              onRhythmLog={store.updateRhythmLog}
              onAsk={() => setActiveTab("ai")}
            />
          )}
          {activeTab === "calendar" && (
            <CalendarView
              prediction={prediction}
              current={current}
              logs={store.cycleLogs}
              dailyLogs={store.dailyLogs}
              onPeriodForDate={store.addPeriodForDate}
              onDailyLog={store.updateDailyLog}
            />
          )}
          {activeTab === "ai" && (
            <AskAiView current={current} dailyLog={todayLog} />
          )}
          {activeTab === "partner" && (
            <PartnerView
              connected={store.connected}
              partnerName={store.partnerName}
              current={current}
              prediction={prediction}
              dailyLog={todayLog}
              visibility={store.visibility}
              onTogglePartner={store.togglePartner}
              onToggleVisibility={store.toggleVisibility}
            />
          )}
          {activeTab === "settings" && <SettingsView store={store} />}
        </div>

        <aside className="hidden min-w-0 flex-col gap-4 lg:flex">
          <InsightCard
            current={current}
            prediction={prediction}
            dailyLog={todayLog}
          />
          <RhythmCard log={todayRhythm} />
          <PrivacyCard />
        </aside>
      </section>

      <nav className="fixed inset-x-3 bottom-3 z-10 mx-auto grid max-w-md grid-cols-5 rounded-[1.4rem] border border-white/70 bg-white/86 p-2 shadow-soft backdrop-blur lg:sticky lg:bottom-4 lg:mt-6 lg:max-w-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={clsx(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.72rem] font-medium transition",
                activeTab === tab.id
                  ? "bg-berry text-white"
                  : "text-charcoal/70 hover:bg-rose/10",
              )}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function HomeView(props: {
  accent: string;
  current: { phase: string; day: number; progress: number };
  prediction: ReturnType<typeof predictCycle>;
  displayName: string;
  todayLog: DailyLog;
  todayRhythm: RhythmLog;
  trackingMode: string;
  cycleLogs: CycleLog[];
  onPeriodStart: () => void;
  onPeriodEnd: () => void;
  onDailyLog: (log: DailyLog) => void;
  onRhythmLog: (log: RhythmLog) => void;
  onAsk: () => void;
}) {
  return (
    <div className="space-y-4">
      <PhaseHero {...props} />

      <QuickLog dailyLog={props.todayLog} onChange={props.onDailyLog} />
      <RhythmLogger
        rhythmLog={props.todayRhythm}
        onChange={props.onRhythmLog}
      />
      <div className="grid gap-4 lg:hidden">
        <InsightCard
          current={props.current}
          prediction={props.prediction}
          dailyLog={props.todayLog}
        />
        <RhythmCard log={props.todayRhythm} />
      </div>
    </div>
  );
}

function PhaseHero(props: {
  accent: string;
  current: { phase: string; day: number; progress: number };
  prediction: ReturnType<typeof predictCycle>;
  displayName: string;
  todayLog: DailyLog;
  todayRhythm: RhythmLog;
  trackingMode: string;
  onPeriodStart: () => void;
  onPeriodEnd: () => void;
  onDailyLog: (log: DailyLog) => void;
  onRhythmLog: (log: RhythmLog) => void;
  onAsk: () => void;
}) {
  const daysLeft = Math.max(0, daysUntil(props.prediction.nextPeriods[0]));
  const weekday = format(new Date(), "EEEE");
  const dateLabel = format(new Date(), "MMM d");

  return (
    <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#fff6f8] via-[#f6effc] to-[#fff8e6] p-5 shadow-soft backdrop-blur sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-6 font-serif text-3xl font-semibold leading-tight text-charcoal sm:mt-8 sm:text-6xl">
            Morning, {props.displayName} <span aria-hidden="true">🌸</span>
          </h2>
          <p className="mt-2 text-base text-charcoal/58 sm:text-lg">
            {weekday} · {dateLabel} · a softer pace is enough
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-luteal/62 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.42),0_24px_60px_rgba(124,86,149,0.18)] sm:p-7">
        <div className="mb-2 flex justify-end">
          <span className="rounded-full bg-white/58 px-5 py-2 text-sm font-bold text-[#8d75b6]">
            Day{" "}
            {Math.min(props.current.day, props.prediction.averageCycleLength)}{" "}
            of your cycle
          </span>
        </div>
        <CycleRing
          day={props.current.day}
          cycleLength={props.prediction.averageCycleLength}
          phase={props.current.phase}
          daysLeft={daysLeft}
        />
        <div className="mt-2 grid grid-cols-4 gap-2 text-center text-sm text-charcoal/48 sm:text-base">
          <PhaseLegend color="bg-rose" label="Menstrual" />
          <PhaseLegend color="bg-blue" label="Follicular" />
          <PhaseLegend color="bg-ovulation" label="Ovulation" />
          <PhaseLegend color="bg-[#8d75b6]" label="Luteal" active />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <EventChip
          label="Period may start"
          value={`${formatDate(props.prediction.nextPeriods[0])} · in ${daysLeft} days`}
        />
        <EventChip
          label="Fertile days"
          value={formatDate(props.prediction.ovulationDate)}
        />
        <EventChip
          label="Go gently from"
          value={formatDate(props.prediction.pmsStart)}
        />
        <EventChip
          label="Feeling steady"
          value={props.prediction.confidence.toLowerCase()}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {props.current.phase === "Menstrual" ? (
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#8d75b6] px-4 font-semibold text-white"
            onClick={props.onPeriodEnd}
          >
            <Check size={18} aria-hidden="true" />
            End my period
          </button>
        ) : (
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-berry px-4 font-semibold text-white"
            onClick={props.onPeriodStart}
          >
            <Plus size={18} aria-hidden="true" />
            My period started
          </button>
        )}
        <button
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-rose/20 bg-white/70 px-4 font-semibold text-berry"
          onClick={props.onAsk}
        >
          <Bot size={18} aria-hidden="true" />
          Ask a question
        </button>
      </div>
    </section>
  );
}

function PhaseLegend({
  color,
  label,
  active = false,
}: {
  color: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className={clsx("min-w-0", active && "font-semibold text-[#8d75b6]")}>
      <span
        className={clsx(
          "mx-auto mb-2 block h-3 w-3 rounded-full",
          color,
          active && "ring-4 ring-white/70",
        )}
      />
      <span className="block truncate">{label}</span>
    </div>
  );
}

function CycleRing({
  day,
  cycleLength,
  phase,
  daysLeft,
}: {
  day: number;
  cycleLength: number;
  phase: string;
  daysLeft: number;
}) {
  const displayDay = Math.min(Math.max(day, 1), cycleLength);
  const markerAngle = -90 + (displayDay / cycleLength) * 360;
  const marker = pointOnCircle(150, 150, 105, markerAngle);
  const segments = [
    { start: 1, end: 5, color: "#F4A7B9" },
    { start: 6, end: Math.max(10, cycleLength - 16), color: "#A8D8EA" },
    {
      start: Math.max(11, cycleLength - 15),
      end: Math.max(13, cycleLength - 12),
      color: "#FFF1A8",
    },
    {
      start: Math.max(14, cycleLength - 11),
      end: cycleLength,
      color: "#BDA7DF",
    },
  ];

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[24rem]"
      aria-label={`${phase} phase, day ${displayDay}`}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 300 300"
        role="img"
        aria-hidden="true"
      >
        <circle
          cx="150"
          cy="150"
          r="105"
          fill="none"
          stroke="rgba(255,255,255,0.64)"
          strokeWidth="14"
        />
        {segments.map((segment, i) => {
          const endOffset = i === segments.length - 1 ? 0.7 : 0.5;
          const startOffset = 0.5;
          return (
            <path
              key={`${segment.start}-${segment.end}`}
              d={describeArc(
                150,
                150,
                105,
                dayToAngle(segment.start - startOffset, cycleLength),
                dayToAngle(segment.end + endOffset, cycleLength),
              )}
              fill="none"
              stroke={segment.color}
              strokeLinecap="butt"
              strokeWidth="14"
            />
          );
        })}
        <circle
          cx={marker.x}
          cy={marker.y}
          r="15"
          fill="rgba(255,255,255,0.62)"
        />
        <circle
          cx={marker.x}
          cy={marker.y}
          r="7"
          fill="#8D75B6"
          stroke="white"
          strokeWidth="4"
        />
      </svg>
      <div className="absolute inset-[22%] grid place-items-center rounded-full bg-white/18 text-center">
        <div>
          <p className="text-sm font-bold text-[#8d75b6] sm:text-base">
            {phase} phase
          </p>
          <p className="font-serif text-4xl leading-none text-charcoal sm:text-5xl">
            Day {displayDay}
          </p>
          <p className="mt-2 text-base font-semibold text-charcoal/48 sm:text-lg">
            of {cycleLength} · about {daysLeft} days to go
          </p>
        </div>
      </div>
    </div>
  );
}

function dayToAngle(day: number, cycleLength: number) {
  return -90 + ((day - 1) / cycleLength) * 360;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function pointOnCircle(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  return polarToCartesian(centerX, centerY, radius, angleInDegrees);
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

function EventChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-rose/20 bg-white/74 px-3 py-2 text-sm">
      <span className="text-charcoal/55">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function MoodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (mood: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {moodOptions.map((mood) => (
        <button
          key={mood.key}
          className={clsx(
            "flex flex-col items-center gap-1 rounded-2xl border p-3 transition",
            value === mood.key
              ? "border-berry bg-berry text-white shadow-lg shadow-berry/25"
              : "border-rose/20 bg-white/75 hover:bg-white/90",
          )}
          onClick={() => onChange(mood.key)}
        >
          <span className="text-2xl">{mood.emoji}</span>
          <span className="text-xs font-semibold">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}

function SymptomPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (symptom: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {symptomOptions.map((symptom) => (
        <button
          key={symptom.key}
          className={clsx(
            "flex items-center gap-2 rounded-2xl border p-3 text-left transition",
            selected.includes(symptom.key)
              ? "border-berry bg-berry text-white shadow-lg shadow-berry/25"
              : "border-rose/20 bg-white/75 hover:bg-white/90",
          )}
          onClick={() => onChange(symptom.key)}
        >
          <span className="text-xl">{symptom.emoji}</span>
          <span className="text-sm font-semibold">{symptom.label}</span>
        </button>
      ))}
    </div>
  );
}

function QuickLog({
  dailyLog,
  onChange,
}: {
  dailyLog: DailyLog;
  onChange: (log: DailyLog) => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onChange(dailyLog);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-petal/50 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-charcoal/60">How are you feeling?</p>
          <h2 className="text-2xl font-semibold">A small check-in</h2>
        </div>
        <Check className="text-charcoal/50" aria-hidden="true" />
      </div>
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-sm font-semibold">Feeling</p>
          <MoodPicker
            value={dailyLog.mood}
            onChange={(mood) => onChange({ ...dailyLog, mood })}
          />
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">What is showing up?</p>
          <SymptomPicker
            selected={dailyLog.symptoms}
            onChange={(symptom) => {
              const next = dailyLog.symptoms.includes(symptom)
                ? dailyLog.symptoms.filter((item) => item !== symptom)
                : [...dailyLog.symptoms, symptom];
              onChange({ ...dailyLog, symptoms: next });
            }}
          />
        </div>
        <button
          className={clsx(
            "flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 font-semibold transition",
            saved
              ? "bg-luteal text-white"
              : "bg-berry text-white hover:bg-berry/90",
          )}
          onClick={handleSave}
        >
          {saved ? (
            <>
              <Check size={18} aria-hidden="true" />
              Saved
            </>
          ) : (
            <>
              <Check size={18} aria-hidden="true" />
              Save check-in
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function RhythmLogger({
  rhythmLog,
  onChange,
}: {
  rhythmLog: RhythmLog;
  onChange: (log: RhythmLog) => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-blue/24 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center gap-3">
        <SunMedium aria-hidden="true" />
        <h2 className="text-2xl font-semibold">Body rhythm</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider
          label="Energy today"
          value={rhythmLog.energy}
          onChange={(energy) => onChange({ ...rhythmLog, energy })}
        />
        <Slider
          label="Sleep last night"
          value={rhythmLog.sleep}
          onChange={(sleep) => onChange({ ...rhythmLog, sleep })}
        />
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-blue/40 bg-white/70 p-4">
      <span className="flex items-center justify-between text-sm font-semibold">
        {label}
        <span>{value}/5</span>
      </span>
      <input
        className="mt-3 w-full accent-berry"
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function CalendarView({
  prediction,
  current,
  logs,
  dailyLogs,
  onPeriodForDate,
  onDailyLog,
}: {
  prediction: ReturnType<typeof predictCycle>;
  current: { phase: string };
  logs: { periodStart: string }[];
  dailyLogs: DailyLog[];
  onPeriodForDate: (date: string) => void;
  onDailyLog: (log: DailyLog) => void;
}) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const days = calendarDays(viewMonth);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const periodStarts = new Set(logs.map((log) => log.periodStart));
  const selectedLog = dailyLogs.find((log) => log.date === selectedDate) ?? {
    date: selectedDate,
    flow: "none",
    mood: "calm",
    symptoms: [],
  };
  const special = new Map([
    [prediction.nextPeriods[0], "Next period"],
    [prediction.ovulationDate, "Ovulation"],
    [prediction.pmsStart, "PMS"],
  ]);

  async function saveDailyLog(log: DailyLog) {
    onDailyLog(log);
    await fetch("/api/cycle/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "daily",
        date: log.date,
        flow: log.flow,
        mood: log.mood,
        symptoms: log.symptoms,
        notes: log.notes,
      }),
    }).catch(() => undefined);
  }

  async function logPeriodStart() {
    onPeriodForDate(selectedDate);
    await fetch("/api/cycle/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "period", periodStart: selectedDate }),
    }).catch(() => undefined);
  }

  function toggleSelectedSymptom(symptom: string) {
    const nextSymptoms = selectedLog.symptoms.includes(symptom)
      ? selectedLog.symptoms.filter((item) => item !== symptom)
      : [...selectedLog.symptoms, symptom];
    saveDailyLog({ ...selectedLog, symptoms: nextSymptoms });
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_20rem]">
      <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/70 p-3 shadow-soft backdrop-blur sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-charcoal/60">Your month</p>
            <div className="flex items-center gap-2">
              <button
                className="grid h-9 w-9 place-items-center rounded-xl border border-rose/20 bg-white/70 hover:bg-rose/10"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <h2 className="text-2xl font-semibold">
                {format(viewMonth, "MMMM yyyy")}
              </h2>
              <button
                className="grid h-9 w-9 place-items-center rounded-xl border border-rose/20 bg-white/70 hover:bg-rose/10"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                aria-label="Next month"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <EventChip label="Today feels like" value={current.phase} />
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold text-charcoal/55 sm:gap-2 sm:text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="mt-2 grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const marker = special.get(key);
            const isPeriod = periodStarts.has(key);
            const hasDailyLog = dailyLogs.some((log) => log.date === key);
            const isSelected = selectedDate === key;
            return (
              <button
                key={key}
                className={clsx(
                  "min-w-0 overflow-hidden rounded-xl border p-1 text-center text-xs transition sm:rounded-2xl sm:text-sm",
                  "flex aspect-square flex-col items-center justify-center",
                  isSameMonth(day, viewMonth)
                    ? "border-rose/10 bg-white/68"
                    : "border-transparent bg-white/25 text-charcoal/35",
                  isToday(day) && "ring-2 ring-berry/60",
                  isSelected && "border-berry bg-blush/80",
                  isPeriod && "bg-rose/75",
                )}
                onClick={() => setSelectedDate(key)}
                aria-label={`Edit ${format(day, "MMMM d")}`}
              >
                <span className="font-semibold">{format(day, "d")}</span>
                <span className="mt-0.5 flex h-2 items-center justify-center gap-0.5">
                  {hasDailyLog && (
                    <Circle
                      className="h-1.5 w-1.5 fill-berry text-berry"
                      aria-hidden="true"
                    />
                  )}
                  {isPeriod && (
                    <Circle
                      className="h-1.5 w-1.5 fill-white text-white"
                      aria-hidden="true"
                    />
                  )}
                </span>
                {marker && (
                  <span className="max-w-full truncate text-[0.48rem] leading-none sm:text-[0.62rem]">
                    {marker}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-charcoal/65">
          <span className="rounded-full bg-rose/60 px-3 py-1">Period</span>
          <span className="rounded-full bg-ovulation/80 px-3 py-1">
            Ovulation
          </span>
          <span className="rounded-full bg-luteal/60 px-3 py-1">PMS</span>
          <span className="rounded-full bg-blush/80 px-3 py-1">Selected</span>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/70 bg-petal/60 p-5 shadow-soft backdrop-blur">
        <p className="text-sm text-charcoal/60">Care note</p>
        <h3 className="text-2xl font-semibold">{formatDate(selectedDate)}</h3>
        <button
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-berry px-4 font-semibold text-white disabled:opacity-60"
          onClick={logPeriodStart}
          disabled={periodStarts.has(selectedDate)}
        >
          <Plus size={18} aria-hidden="true" />
          {periodStarts.has(selectedDate)
            ? "Period noted"
            : "My period started"}
        </button>
        <label className="mt-4 block">
          <span className="mb-3 block text-sm font-semibold">Bleeding</span>
          <div className="grid grid-cols-5 gap-1.5">
            {flowOptions.map((flow) => (
              <button
                key={flow.key}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-2xl border p-2.5 transition",
                  selectedLog.flow === flow.key
                    ? "border-berry bg-berry text-white shadow-lg shadow-berry/25"
                    : "border-rose/20 bg-white/78 hover:bg-white/90",
                )}
                onClick={() =>
                  saveDailyLog({
                    ...selectedLog,
                    flow: flow.key as DailyLog["flow"],
                  })
                }
              >
                <span className="text-lg leading-none">{flow.emoji}</span>
                <span className="text-[0.6rem] font-semibold leading-tight">
                  {flow.label}
                </span>
              </button>
            ))}
          </div>
        </label>
        <div className="mt-4">
          <p className="mb-3 text-sm font-semibold">Feeling</p>
          <MoodPicker
            value={selectedLog.mood}
            onChange={(mood) =>
              saveDailyLog({ ...selectedLog, mood })
            }
          />
        </div>
        <div className="mt-4">
          <p className="mb-3 text-sm font-semibold">What did you notice?</p>
          <SymptomPicker
            selected={selectedLog.symptoms}
            onChange={toggleSelectedSymptom}
          />
        </div>
      </div>
    </section>
  );
}

function AskAiView({
  current,
  dailyLog,
}: {
  current: { phase: string; day: number };
  dailyLog: DailyLog;
}) {
  const [message, setMessage] = useState("Why do I feel so tired today?");
  const [reply, setReply] = useState(
    `You are in the ${current.phase} phase. Tell me what you are feeling, and I will answer with care.`,
  );
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        context: {
          userType: "cycle tracker",
          phase: current.phase,
          cycleDay: current.day,
          mood: dailyLog.mood,
          symptoms: dailyLog.symptoms,
        },
      }),
    });
    const data = await response.json();
    setReply(
      data.reply ??
        "I do not have the right words yet, but I am here with you.",
    );
    setLoading(false);
  }

  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-white/70 p-5 shadow-soft backdrop-blur">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue/70">
          <Sparkles aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-charcoal/60">Ask Cycle</p>
          <h2 className="text-2xl font-semibold">A gentle answer</h2>
        </div>
      </div>
      <div className="rounded-[1.25rem] bg-berry p-4 text-white">
        <p className="whitespace-pre-line leading-relaxed">{reply}</p>
      </div>
      <label className="mt-5 block">
        <span className="text-sm font-semibold">What is on your mind?</span>
        <textarea
          className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-rose/20 bg-white/82 p-4"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <button
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-berry px-4 font-semibold text-white disabled:opacity-60"
        onClick={ask}
        disabled={loading}
      >
        <Bot size={18} aria-hidden="true" />
        {loading ? "Taking a moment..." : "Ask with care"}
      </button>
    </section>
  );
}

function PartnerView({
  connected,
  partnerName,
  current,
  prediction,
  dailyLog,
  visibility,
  onTogglePartner,
  onToggleVisibility,
}: {
  connected: boolean;
  partnerName: string;
  current: { phase: string; day: number };
  prediction: ReturnType<typeof predictCycle>;
  dailyLog: DailyLog;
  visibility: {
    phase: boolean;
    periodDate: boolean;
    mood: boolean;
    symptoms: boolean;
  };
  onTogglePartner: () => void;
  onToggleVisibility: (key: keyof typeof visibility) => void;
}) {
  const [partnerCode, setPartnerCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [status, setStatus] = useState("");

  async function createInvite() {
    setStatus("");
    const response = await fetch("/api/partner/invite", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "I could not make a care code just yet.");
      return;
    }

    setPartnerCode(data.partnerCode);
    setStatus("Partner code created.");
  }

  async function connectPartner() {
    setStatus("");
    const response = await fetch("/api/partner/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerCode: joinCode }),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "I could not join with that code just yet.");
      return;
    }

    setStatus("You are connected now.");
    onTogglePartner();
  }

  async function updateVisibility(key: keyof typeof visibility) {
    const next = { ...visibility, [key]: !visibility[key] };
    onToggleVisibility(key);
    await fetch("/api/partner/visibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: next }),
    }).catch(() => undefined);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-5 shadow-soft backdrop-blur">
        <div className="mb-5">
          <p className="text-sm text-charcoal/60">Partner care</p>
          <h2 className="text-2xl font-semibold">
            {connected ? "You're connected" : "Invite someone you trust"}
          </h2>
        </div>
        {!connected && (
          <div className="mb-5 grid gap-3 rounded-3xl bg-petal/60 p-3 sm:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl bg-white/70 p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold text-berry">
                <KeyRound size={18} aria-hidden="true" />
                Share a care code
              </div>
              <button
                className="min-h-11 w-full rounded-2xl bg-berry px-4 font-semibold text-white"
                onClick={createInvite}
              >
                Create code
              </button>
              {partnerCode && (
                <button
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose/20 bg-white px-4 font-semibold"
                  onClick={() => navigator.clipboard.writeText(partnerCode)}
                >
                  <Copy size={17} aria-hidden="true" />
                  {partnerCode}
                </button>
              )}
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <label className="text-sm font-semibold" htmlFor="partner-code">
                Enter a care code
              </label>
              <input
                id="partner-code"
                className="mt-2 h-11 w-full rounded-2xl border border-rose/20 bg-white px-4 uppercase"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="A1B2C"
              />
              <button
                className="mt-3 min-h-11 w-full rounded-2xl border border-charcoal/10 bg-white px-4 font-semibold text-charcoal disabled:opacity-60"
                onClick={connectPartner}
                disabled={!joinCode}
              >
                Join
              </button>
            </div>
          </div>
        )}
        {status && (
          <p className="mb-4 rounded-2xl bg-ovulation/70 p-3 text-sm">
            {status}
          </p>
        )}
        {connected && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <PartnerMetric
                label="What they can see"
                value={visibility.phase ? current.phase : "Kept just for you"}
              />
              <PartnerMetric
                label="Period may start"
                value={
                  visibility.periodDate
                    ? formatDate(prediction.nextPeriods[0])
                    : "Kept just for you"
                }
              />
              <PartnerMetric
                label="Feeling today"
                value={visibility.mood ? dailyLog.mood : "Kept just for you"}
              />
              <PartnerMetric
                label="Care idea"
                value={`During ${current.phase}, patience and practical help can mean a lot.`}
              />
            </div>
            <div className="mt-4 rounded-[1.5rem] border border-white/70 bg-petal/40 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">What feels okay to share</h3>
                <button
                  className="rounded-xl bg-charcoal/10 px-3 py-1.5 text-xs font-semibold text-charcoal/60 hover:bg-charcoal/20"
                  onClick={onTogglePartner}
                >
                  Disconnect
                </button>
              </div>
              {Object.entries(visibility).map(([key, value]) => (
                <button
                  key={key}
                  className="mb-2 flex min-h-12 w-full items-center justify-between rounded-2xl border border-rose/20 bg-white/72 px-4"
                  onClick={() => updateVisibility(key as keyof typeof visibility)}
                >
                  <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="flex items-center gap-2 font-semibold">
                    {value ? (
                      <Unlock size={17} aria-hidden="true" />
                    ) : (
                      <Lock size={17} aria-hidden="true" />
                    )}
                    {value ? "Shared" : "Just me"}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function PartnerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-rose/20 bg-white/72 p-4">
      <p className="text-sm text-charcoal/58">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function SettingsView({ store }: { store: CycleState }) {
  return (
    <section className="space-y-4">
      <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-5 shadow-soft backdrop-blur">
        <div className="mb-4 flex items-center gap-3">
          <UserRound aria-hidden="true" />
          <h2 className="text-2xl font-semibold">About you</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold">Name</span>
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-rose/20 bg-white/82 px-4"
              value={store.displayName}
              onChange={(event) =>
                store.setProfile({ displayName: event.target.value })
              }
            />
          </label>
          <label>
            <span className="text-sm font-semibold">
              What would you like to follow?
            </span>
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-rose/20 bg-white/82 px-4"
              value={store.trackingMode}
              onChange={(event) =>
                store.setProfile({
                  trackingMode: event.target.value as
                    | "cycle"
                    | "rhythm"
                    | "partner",
                })
              }
            >
              <option value="cycle">Cycle</option>
              <option value="rhythm">Rhythm</option>
              <option value="partner">Partner</option>
            </select>
          </label>
        </div>
      </div>
      <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-5 shadow-soft backdrop-blur">
        <h3 className="mb-3 text-xl font-semibold">Gentle reminders</h3>
        <button
          className="mb-3 flex min-h-12 w-full items-center justify-between rounded-2xl border border-rose/20 bg-white/72 px-4"
          onClick={store.toggleNotifications}
        >
          <span>Remind me kindly</span>
          <span className="font-semibold">
            {store.notifications ? "On" : "Off"}
          </span>
        </button>
        <button className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-rose/20 bg-white/72 px-4">
          <span>Keep a copy for myself</span>
          <Download size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function InsightCard({
  current,
  prediction,
  dailyLog,
}: {
  current: { phase: string; day: number };
  prediction: ReturnType<typeof predictCycle>;
  dailyLog: DailyLog;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-petal/50 p-5 shadow-soft backdrop-blur">
      <div className="mb-3 flex items-center gap-3">
        <Sparkles aria-hidden="true" />
        <h2 className="text-xl font-semibold">For today</h2>
      </div>
      <p className="leading-relaxed">
        Day {current.day} may ask for a little more tenderness. You noted
        feeling {dailyLog.mood}; choose one kind thing for yourself before{" "}
        {formatDate(prediction.nextPeriods[0])}.
      </p>
      {prediction.irregular && (
        <p className="mt-3 rounded-2xl bg-ovulation/70 p-3 text-sm">
          Your cycle may need a wider window this time:{" "}
          {formatDate(prediction.range!.start)} to{" "}
          {formatDate(prediction.range!.end)}.
        </p>
      )}
    </section>
  );
}

function RhythmCard({ log }: { log: RhythmLog }) {
  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-blue/24 p-5 shadow-soft backdrop-blur">
      <div className="mb-3 flex items-center gap-3">
        <SunMedium aria-hidden="true" />
        <h2 className="text-xl font-semibold">Your body this week</h2>
      </div>
      <p className="leading-relaxed">
        Energy feels like {log.energy}/5 and sleep felt like {log.sleep}/5. Keep
        noticing the small shifts; they count.
      </p>
    </section>
  );
}

function PrivacyCard() {
  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-white/70 p-5 shadow-soft backdrop-blur">
      <div className="mb-3 flex items-center gap-3">
        <Shield aria-hidden="true" />
        <h2 className="text-xl font-semibold">You choose</h2>
      </div>
      <p className="leading-relaxed">
        Only share what feels right. Your notes, moods, and body signals belong
        to you.
      </p>
      <button className="mt-3 flex items-center gap-2 font-semibold">
        Choose what to share
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </section>
  );
}
