import { create } from "zustand";

const STORAGE_KEY = "core-learn-study-prefs";

export interface StudyPrefsState {
  dailyGoal: number;
  notificationsEnabled: boolean;
  reminderHour: number;
  setDailyGoal: (n: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setReminderHour: (hour: number) => void;
  hydrate: () => void;
}

function clampGoal(n: number): number {
  if (!Number.isFinite(n)) return 3;
  return Math.min(50, Math.max(1, Math.round(n)));
}

function clampHour(n: number): number {
  if (!Number.isFinite(n)) return 9;
  return Math.min(23, Math.max(0, Math.round(n)));
}

function readStored(): Pick<
  StudyPrefsState,
  "dailyGoal" | "notificationsEnabled" | "reminderHour"
> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        dailyGoal: 3,
        notificationsEnabled: true,
        reminderHour: 9,
      };
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      dailyGoal: clampGoal(Number(parsed.dailyGoal ?? 3)),
      notificationsEnabled: parsed.notificationsEnabled !== false,
      reminderHour: clampHour(Number(parsed.reminderHour ?? 9)),
    };
  } catch {
    return {
      dailyGoal: 3,
      notificationsEnabled: true,
      reminderHour: 9,
    };
  }
}

function persist(
  dailyGoal: number,
  notificationsEnabled: boolean,
  reminderHour: number,
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ dailyGoal, notificationsEnabled, reminderHour }),
  );
}

export const useStudyPrefsStore = create<StudyPrefsState>((set, get) => ({
  dailyGoal: 3,
  notificationsEnabled: true,
  reminderHour: 9,
  setDailyGoal: (n) => {
    const dailyGoal = clampGoal(n);
    const { notificationsEnabled, reminderHour } = get();
    persist(dailyGoal, notificationsEnabled, reminderHour);
    set({ dailyGoal });
  },
  setNotificationsEnabled: (enabled) => {
    const { dailyGoal, reminderHour } = get();
    persist(dailyGoal, enabled, reminderHour);
    set({ notificationsEnabled: enabled });
  },
  setReminderHour: (hour) => {
    const reminderHour = clampHour(hour);
    const { dailyGoal, notificationsEnabled } = get();
    persist(dailyGoal, notificationsEnabled, reminderHour);
    set({ reminderHour });
  },
  hydrate: () => {
    set(readStored());
  },
}));
