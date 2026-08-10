import { create } from "zustand";
import { getProgressBySubject } from "../db/repository";
import {
  visibleTourSteps,
  type TourStep,
} from "../lib/tour-steps";

const STORAGE_KEY = "core-learn:tour-v1";

type TourPersisted = {
  hasCompleted: boolean;
};

type TourState = {
  active: boolean;
  stepIndex: number;
  hasCompleted: boolean;
  steps: TourStep[];
  subjectId: string | null;
  hydrated: boolean;
  hydrate: () => void;
  start: () => Promise<void>;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
};

function readCompleted(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as TourPersisted;
    return Boolean(parsed.hasCompleted);
  } catch {
    return false;
  }
}

function persistCompleted(hasCompleted: boolean) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ hasCompleted }));
}

function finish(set: (partial: Partial<TourState>) => void) {
  persistCompleted(true);
  set({
    active: false,
    hasCompleted: true,
    stepIndex: 0,
  });
}

export const useTourStore = create<TourState>((set, get) => ({
  active: false,
  stepIndex: 0,
  hasCompleted: false,
  steps: [],
  subjectId: null,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ hasCompleted: readCompleted(), hydrated: true });
  },

  start: async () => {
    const bySubject = await getProgressBySubject();
    const subjectId = bySubject[0]?.subject.id ?? null;
    const steps = visibleTourSteps(subjectId != null);
    set({
      active: true,
      stepIndex: 0,
      steps,
      subjectId,
    });
  },

  next: () => {
    const { stepIndex, steps } = get();
    if (stepIndex >= steps.length - 1) {
      finish(set);
      return;
    }
    set({ stepIndex: stepIndex + 1 });
  },

  prev: () => {
    const { stepIndex } = get();
    if (stepIndex <= 0) return;
    set({ stepIndex: stepIndex - 1 });
  },

  skip: () => {
    finish(set);
  },

  complete: () => {
    finish(set);
  },
}));
