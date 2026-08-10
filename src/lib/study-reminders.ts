import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import {
  getDueReviews,
  getTodayStudyCount,
} from "../db/repository";
import { useStudyPrefsStore } from "../stores/studyPrefs";

const LAST_NOTIFY_KEY = "core-learn-last-notify-date";

function todayLocalKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function ensurePermission(): Promise<boolean> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }
    return granted;
  } catch {
    return false;
  }
}

/**
 * Envia no máximo 1 lembrete por dia local se houver revisões pendentes
 * ou meta diária incompleta.
 */
export async function maybeSendStudyReminder(options?: {
  /** Se true, só dispara quando a hora local >= reminderHour. */
  respectReminderHour?: boolean;
}): Promise<void> {
  const { notificationsEnabled, dailyGoal, reminderHour } =
    useStudyPrefsStore.getState();
  if (!notificationsEnabled) return;

  const now = new Date();
  if (options?.respectReminderHour && now.getHours() < reminderHour) {
    return;
  }

  const today = todayLocalKey(now);
  if (localStorage.getItem(LAST_NOTIFY_KEY) === today) return;

  const [due, todayCount] = await Promise.all([
    getDueReviews(now),
    getTodayStudyCount(now),
  ]);
  const goalMet = todayCount >= dailyGoal;
  if (due.length === 0 && goalMet) return;

  const permitted = await ensurePermission();
  if (!permitted) return;

  // Re-check after async permission prompt in case the day rolled over.
  if (localStorage.getItem(LAST_NOTIFY_KEY) === today) return;

  const parts: string[] = [];
  if (due.length > 0) {
    parts.push(
      `${due.length} revisão${due.length === 1 ? "" : "ões"} pendente${due.length === 1 ? "" : "s"}`,
    );
  }
  if (!goalMet) {
    parts.push(`meta ${todayCount}/${dailyGoal}`);
  }

  sendNotification({
    title: "Core Learn",
    body: `Hora de estudar — ${parts.join(" · ")}.`,
  });
  localStorage.setItem(LAST_NOTIFY_KEY, today);
}

/** Polling leve enquanto o app estiver aberto (hora do lembrete + 1×/dia). */
export function startStudyReminderLoop(): () => void {
  const tick = () => {
    void maybeSendStudyReminder({ respectReminderHour: true });
  };

  // Primeira checagem no boot (respeita horário).
  tick();

  const id = window.setInterval(tick, 60_000);
  return () => window.clearInterval(id);
}
