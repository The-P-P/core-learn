import { Flame, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  MilestoneCelebration,
  crossedThreshold,
  type MilestoneEvent,
} from "../components/MilestoneCelebration";
import { NameDialog } from "../components/NameDialog";
import { ProgressBar } from "../components/ProgressBar";
import { WeeklyChart } from "../components/WeeklyChart";
import { Button } from "../components/ui/Button";
import { PageSkeleton } from "../components/ui/Skeleton";
import {
  confirmReview,
  createSubject,
  deleteSubject,
  getDueReviews,
  getOverallProgress,
  getProgressBySubject,
  getStudyStreak,
  getTodayStudyCount,
  getWeeklyCompletions,
  restartReview,
  updateSubject,
} from "../db/repository";
import type { Subject, SubjectProgress, TopicWithContext, WeeklyStat } from "../db/types";
import { staggerContainer, staggerItem } from "../lib/motion";
import { useStudyPrefsStore } from "../stores/studyPrefs";
import { useThemeStore } from "../stores/theme";

type NameDialogState =
  | { mode: "create" }
  | { mode: "edit"; subject: Subject }
  | null;

type ConfirmState = {
  subject: Subject;
  total: number;
} | null;

export function Dashboard() {
  const navigate = useNavigate();
  const [overall, setOverall] = useState({ total: 0, completed: 0 });
  const [bySubject, setBySubject] = useState<SubjectProgress[]>([]);
  const [due, setDue] = useState<TopicWithContext[]>([]);
  const [weekly, setWeekly] = useState<WeeklyStat[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [milestone, setMilestone] = useState<MilestoneEvent>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [nameDialog, setNameDialog] = useState<NameDialogState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);
  const prevPct = useRef<number | null>(null);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const dailyGoal = useStudyPrefsStore((s) => s.dailyGoal);

  const refresh = useCallback(async () => {
    const [o, subjects, reviews, weeks, today, streakDays] = await Promise.all([
      getOverallProgress(),
      getProgressBySubject(),
      getDueReviews(),
      getWeeklyCompletions(8),
      getTodayStudyCount(),
      getStudyStreak(),
    ]);
    const nextPct =
      o.total > 0 ? Math.round((o.completed / o.total) * 100) : 0;
    if (prevPct.current !== null) {
      const crossed = crossedThreshold(prevPct.current, nextPct);
      if (crossed !== null) {
        setMilestone({
          id: `overall-${crossed}-${Date.now()}`,
          message:
            crossed === 100
              ? "Guia 100% concluído. Extraordinário."
              : `${crossed}% do guia — continue assim.`,
        });
        setPulseKey((k) => k + 1);
      }
    }
    prevPct.current = nextPct;
    setOverall(o);
    setBySubject(subjects);
    setDue(reviews);
    setWeekly(weeks);
    setTodayCount(today);
    setStreak(streakDays);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pct =
    overall.total > 0
      ? Math.round((overall.completed / overall.total) * 100)
      : 0;

  const firstSubjectHref =
    bySubject[0] != null ? `/subject/${bySubject[0].subject.id}` : "/";

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-10">
      <MilestoneCelebration
        event={milestone}
        onDone={() => setMilestone(null)}
      />

      <NameDialog
        open={nameDialog != null}
        title={
          nameDialog?.mode === "edit" ? "Editar matéria" : "Nova matéria"
        }
        namePlaceholder="Ex: Anatomia"
        showTag
        initialName={
          nameDialog?.mode === "edit" ? nameDialog.subject.name : ""
        }
        initialTag={
          nameDialog?.mode === "edit" ? nameDialog.subject.tag : ""
        }
        confirmLabel={nameDialog?.mode === "edit" ? "Salvar" : "Criar"}
        busy={busy}
        onCancel={() => {
          if (!busy) setNameDialog(null);
        }}
        onConfirm={async ({ name, tag }) => {
          if (!nameDialog) return;
          setBusy(true);
          try {
            if (nameDialog.mode === "create") {
              const created = await createSubject({ name, tag });
              setNameDialog(null);
              await refresh();
              navigate(`/subject/${created.id}`);
            } else {
              await updateSubject(nameDialog.subject.id, {
                name,
                tag: tag ?? nameDialog.subject.tag,
              });
              setNameDialog(null);
              await refresh();
            }
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmDialog
        open={confirm != null}
        title="Excluir matéria?"
        message={
          confirm
            ? `“${confirm.subject.name}” e todo o conteúdo serão removidos (${confirm.total} tópico${confirm.total === 1 ? "" : "s"}). Esta ação não pode ser desfeita.`
            : ""
        }
        busy={busy}
        onCancel={() => {
          if (!busy) setConfirm(null);
        }}
        onConfirm={async () => {
          if (!confirm) return;
          setBusy(true);
          try {
            await deleteSubject(confirm.subject.id);
            setConfirm(null);
            await refresh();
          } finally {
            setBusy(false);
          }
        }}
      />

      <section data-tour="progress">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
          Progresso geral
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">
          {pct}%
          <span className="ml-3 font-mono text-base font-normal text-muted">
            {overall.completed}/{overall.total} tópicos
          </span>
        </h1>
        <ProgressBar
          value={overall.completed}
          max={overall.total}
          className="mt-4 max-w-xl"
          pulseKey={pulseKey}
        />
      </section>

      <section
        data-tour="habits"
        className="grid max-w-xl gap-3 sm:grid-cols-2"
      >
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface/40 px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            <Target size={14} />
            Meta de hoje
          </div>
          <p className="mt-2 font-serif text-2xl font-semibold">
            {todayCount}
            <span className="ml-1 font-mono text-base font-normal text-muted">
              / {dailyGoal}
            </span>
          </p>
          <ProgressBar
            value={Math.min(todayCount, dailyGoal)}
            max={dailyGoal}
            className="mt-3"
          />
          <p className="mt-2 text-xs text-muted">
            {todayCount >= dailyGoal
              ? "Meta do dia concluída."
              : due.length > 0
                ? `${due.length} revisão${due.length === 1 ? "" : "ões"} pendente${due.length === 1 ? "" : "s"} — bom momento para estudar.`
                : `Faltam ${dailyGoal - todayCount} ação${dailyGoal - todayCount === 1 ? "" : "ões"} (concluir ou revisar).`}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface/40 px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            <Flame size={14} />
            Sequência
          </div>
          <p className="mt-2 font-serif text-2xl font-semibold">
            {streak}
            <span className="ml-1 font-mono text-base font-normal text-muted">
              {streak === 1 ? "dia" : "dias"}
            </span>
          </p>
          <p className="mt-2 text-xs text-muted">
            {streak === 0
              ? "Conclua ou revise um tópico para começar a sequência."
              : "Dias seguidos com pelo menos uma conclusão ou revisão."}
          </p>
        </div>
      </section>

      <section data-tour="subjects">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold">Matérias</h2>
          <Button
            variant="accent"
            className="h-auto px-3 py-1.5 text-xs"
            onClick={() => setNameDialog({ mode: "create" })}
          >
            <Plus size={14} />
            Adicionar matéria
          </Button>
        </div>

        {bySubject.length === 0 ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-surface/30 px-4 py-8 text-center">
            <p className="text-sm text-muted">Nenhuma matéria ainda.</p>
            <Button
              variant="accent"
              className="mt-4 h-auto px-3 py-1.5 text-xs"
              onClick={() => setNameDialog({ mode: "create" })}
            >
              <Plus size={14} />
              Criar primeira matéria
            </Button>
          </div>
        ) : (
          <motion.div
            className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={reducedMotion ? undefined : staggerContainer}
            initial={reducedMotion ? false : "initial"}
            animate="animate"
          >
            {bySubject.map(({ subject, total, completed }) => {
              const subjectPct =
                total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <motion.div
                  key={subject.id}
                  variants={reducedMotion ? undefined : staggerItem}
                  className="rounded-[var(--radius-lg)] border border-border bg-surface/40 transition-[border-color,box-shadow] duration-200 hover:border-accent hover:shadow-sm"
                >
                  <Link
                    to={`/subject/${subject.id}`}
                    className="block p-4 pb-2 transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-serif text-lg font-semibold">
                        {subject.name}
                      </h3>
                      <span className="font-mono text-[11px] text-accent">
                        {subject.tag}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-xs text-muted">
                      {completed}/{total} · {subjectPct}%
                    </p>
                    <ProgressBar
                      value={completed}
                      max={total}
                      className="mt-3"
                    />
                  </Link>
                  <div className="flex justify-end gap-1 border-t border-border/70 px-2 py-1.5">
                    <Button
                      variant="ghost"
                      className="h-auto px-2 py-1 text-xs"
                      aria-label={`Editar ${subject.name}`}
                      onClick={() =>
                        setNameDialog({ mode: "edit", subject })
                      }
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-auto px-2 py-1 text-xs text-danger hover:border-danger hover:text-danger"
                      aria-label={`Excluir ${subject.name}`}
                      onClick={() => setConfirm({ subject, total })}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      <section data-tour="reviews">
        <h2 className="font-serif text-2xl font-semibold">
          Revisões pendentes hoje
        </h2>
        {due.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Nenhuma revisão pendente. Na matéria, abra a aba Concluídos, selecione
            os tópicos e coloque na fila de revisão.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-surface/30">
            {due.map((topic) => (
              <li
                key={topic.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-accent">
                    {topic.subject_tag} · {topic.block_name}
                  </div>
                  <div className="text-sm">{topic.name}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    className="h-auto px-3 py-1.5 text-xs"
                    onClick={async () => {
                      await confirmReview(topic.id);
                      await refresh();
                    }}
                  >
                    Revisei
                  </Button>
                  <Button
                    variant="warning"
                    className="h-auto px-3 py-1.5 text-xs"
                    onClick={async () => {
                      await restartReview(topic.id);
                      await refresh();
                    }}
                  >
                    Preciso rever de novo
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <WeeklyChart data={weekly} ctaHref={firstSubjectHref} />
    </div>
  );
}
