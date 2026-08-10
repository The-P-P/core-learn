export const REVIEW_INTERVALS_DAYS = [7, 16, 35] as const;

export type ReviewStage = 0 | 1 | 2 | 3;

export function addDaysIso(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** After completing a topic: stage 1, review in 7 days. */
export function scheduleAfterComplete(now = new Date()) {
  return {
    review_stage: 1 as ReviewStage,
    next_review_at: addDaysIso(now, REVIEW_INTERVALS_DAYS[0]),
  };
}

/** After confirming a review: advance 7 → 16 → 35. */
export function scheduleAfterReview(currentStage: number, now = new Date()) {
  if (currentStage <= 1) {
    return {
      review_stage: 2 as ReviewStage,
      next_review_at: addDaysIso(now, REVIEW_INTERVALS_DAYS[1]),
    };
  }
  return {
    review_stage: 3 as ReviewStage,
    next_review_at: addDaysIso(now, REVIEW_INTERVALS_DAYS[2]),
  };
}

/** "Preciso rever de novo": restart curve at +7 days. */
export function scheduleRestart(now = new Date()) {
  return {
    review_stage: 1 as ReviewStage,
    next_review_at: addDaysIso(now, REVIEW_INTERVALS_DAYS[0]),
  };
}

/** Force a completed topic into the pending-review queue now. */
export function scheduleDueNow(currentStage: number, now = new Date()) {
  const clamped = Math.min(Math.max(currentStage, 1), 3) as ReviewStage;
  return {
    review_stage: clamped,
    next_review_at: now.toISOString(),
  };
}

export function isDueForReview(nextReviewAt: string | null, now = new Date()): boolean {
  if (!nextReviewAt) return false;
  return new Date(nextReviewAt).getTime() <= now.getTime();
}
