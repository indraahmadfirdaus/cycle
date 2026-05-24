"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { subDays } from "date-fns";
import type { CycleLog, DailyLog, RhythmLog } from "./cycle";
import { todayKey } from "./cycle";

type Visibility = {
  phase: boolean;
  periodDate: boolean;
  mood: boolean;
  symptoms: boolean;
};

export type CycleState = {
  displayName: string;
  gender: "woman" | "man" | "other";
  trackingMode: "cycle" | "rhythm" | "partner";
  partnerName: string;
  connected: boolean;
  notifications: boolean;
  notificationTime: string;
  visibility: Visibility;
  cycleLogs: CycleLog[];
  dailyLogs: DailyLog[];
  rhythmLogs: RhythmLog[];
  setProfile: (
    payload: Partial<
      Pick<CycleState, "displayName" | "gender" | "trackingMode">
    >,
  ) => void;
  addPeriodStart: () => void;
  endCurrentPeriod: () => void;
  addPeriodForDate: (date: string) => void;
  updateDailyLog: (log: DailyLog) => void;
  updateRhythmLog: (log: RhythmLog) => void;
  toggleVisibility: (key: keyof Visibility) => void;
  togglePartner: () => void;
  toggleNotifications: () => void;
};

const seedCycles: CycleLog[] = [
  {
    id: "c1",
    periodStart: todayKey(subDays(new Date(), 86)),
    periodEnd: todayKey(subDays(new Date(), 82)),
  },
  {
    id: "c2",
    periodStart: todayKey(subDays(new Date(), 58)),
    periodEnd: todayKey(subDays(new Date(), 54)),
  },
  {
    id: "c3",
    periodStart: todayKey(subDays(new Date(), 30)),
    periodEnd: todayKey(subDays(new Date(), 26)),
  },
];

export const useCycleStore = create<CycleState>()(
  persist(
    (set) => ({
      displayName: "Syifa",
      gender: "woman",
      trackingMode: "cycle",
      partnerName: "Reza",
      connected: true,
      notifications: true,
      notificationTime: "09:00",
      visibility: {
        phase: true,
        periodDate: true,
        mood: true,
        symptoms: false,
      },
      cycleLogs: seedCycles,
      dailyLogs: [
        {
          date: todayKey(),
          flow: "none",
          mood: "calm",
          symptoms: ["fatigue"],
          notes: "Easy day, light walk.",
        },
      ],
      rhythmLogs: [
        {
          date: todayKey(),
          energy: 4,
          sleep: 3,
          mood: "focused",
          symptoms: ["muscle soreness"],
        },
      ],
      setProfile: (payload) => set(payload),
      addPeriodStart: () =>
        set((state) => ({
          cycleLogs: [
            ...state.cycleLogs,
            {
              id: crypto.randomUUID(),
              periodStart: todayKey(),
            },
          ],
        })),
      endCurrentPeriod: () =>
        set((state) => {
          const sorted = [...state.cycleLogs].sort(
            (a, b) =>
              new Date(a.periodStart).getTime() -
              new Date(b.periodStart).getTime(),
          );
          const active = sorted[sorted.length - 1];
          if (!active || active.periodEnd) return state;
          return {
            cycleLogs: state.cycleLogs.map((log) =>
              log.id === active.id
                ? { ...log, periodEnd: todayKey() }
                : log,
            ),
          };
        }),
      addPeriodForDate: (date) =>
        set((state) => {
          if (state.cycleLogs.some((log) => log.periodStart === date)) {
            return state;
          }

          return {
            cycleLogs: [
              ...state.cycleLogs,
              {
                id: crypto.randomUUID(),
                periodStart: date,
              },
            ],
          };
        }),
      updateDailyLog: (log) =>
        set((state) => ({
          dailyLogs: [
            log,
            ...state.dailyLogs.filter((item) => item.date !== log.date),
          ],
        })),
      updateRhythmLog: (log) =>
        set((state) => ({
          rhythmLogs: [
            log,
            ...state.rhythmLogs.filter((item) => item.date !== log.date),
          ],
        })),
      toggleVisibility: (key) =>
        set((state) => ({
          visibility: { ...state.visibility, [key]: !state.visibility[key] },
        })),
      togglePartner: () => set((state) => ({ connected: !state.connected })),
      toggleNotifications: () =>
        set((state) => ({ notifications: !state.notifications })),
    }),
    {
      name: "cycle-app-state",
      skipHydration: true,
    },
  ),
);
