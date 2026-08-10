import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  MilestoneCelebration,
  type MilestoneEvent,
} from "../components/MilestoneCelebration";
import { NameDialog } from "../components/NameDialog";
import { ProgressBar } from "../components/ProgressBar";
import { TopicRow } from "../components/TopicRow";
import { Button } from "../components/ui/Button";
import { PageSkeleton } from "../components/ui/Skeleton";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import {
  createBlock,
  createTopic,
  deleteBlock,
  deleteSubject,
  deleteTopic,
  forceReviewsNow,
  getSubjectTree,
  setTopicCompleted,
  updateBlock,
  updateSubject,
  updateTopicDifficulty,
  updateTopicName,
  updateTopicPriority,
} from "../db/repository";
import type { Difficulty, Priority, Topic } from "../db/types";
import { isDueForReview } from "../lib/review";

type Filter =
  | "todos"
  | "pendentes"
  | "concluidos"
  | "alta"
  | "revisar";

type BlockWithTopics = {
  id: string;
  name: string;
  sort_order: number;
  topics: Topic[];
};

type NameDialogState =
  | { kind: "subject"; mode: "edit" }
  | { kind: "block"; mode: "create" }
  | { kind: "block"; mode: "edit"; blockId: string; name: string }
  | { kind: "topic"; mode: "create"; blockId: string }
  | { kind: "topic"; mode: "edit"; topicId: string; name: string }
  | null;

type ConfirmState =
  | {
      kind: "subject";
      topicCount: number;
      blockCount: number;
    }
  | { kind: "block"; blockId: string; name: string; topicCount: number }
  | { kind: "topic"; topicId: string; name: string }
  | null;

const filters: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pendentes", label: "Pendentes" },
  { id: "concluidos", label: "Concluídos" },
  { id: "alta", label: "Prioridade alta" },
  { id: "revisar", label: "Para revisar" },
];

function matchesFilter(topic: Topic, filter: Filter): boolean {
  switch (filter) {
    case "pendentes":
      return topic.completed === 0;
    case "concluidos":
      return topic.completed === 1;
    case "alta":
      return topic.priority === "alta";
    case "revisar":
      return topic.completed === 1 && isDueForReview(topic.next_review_at);
    default:
      return true;
  }
}

function blockComplete(block: BlockWithTopics) {
  return (
    block.topics.length > 0 &&
    block.topics.every((t) => t.completed === 1)
  );
}

export function SubjectPage() {
  const { subjectId = "" } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [blocks, setBlocks] = useState<BlockWithTopics[]>([]);
  const [filter, setFilter] = useState<Filter>("todos");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [milestone, setMilestone] = useState<MilestoneEvent>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [blockPulse, setBlockPulse] = useState<Record<string, number>>({});
  const [nameDialog, setNameDialog] = useState<NameDialogState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);
  const prevBlocks = useRef<BlockWithTopics[] | null>(null);
  const prevSubjectDone = useRef<boolean | null>(null);

  const refresh = useCallback(async () => {
    const tree = await getSubjectTree(subjectId);
    if (!tree) {
      setName("");
      setTag("");
      setBlocks([]);
      setLoading(false);
      return;
    }
    setName(tree.subject.name);
    setTag(tree.subject.tag);

    const nextBlocks = tree.blocks;
    if (prevBlocks.current) {
      for (const block of nextBlocks) {
        const was = prevBlocks.current.find((b) => b.id === block.id);
        if (was && !blockComplete(was) && blockComplete(block)) {
          setMilestone({
            id: `block-${block.id}-${Date.now()}`,
            message: `Bloco concluído: ${block.name}`,
          });
          setBlockPulse((p) => ({ ...p, [block.id]: (p[block.id] ?? 0) + 1 }));
          setPulseKey((k) => k + 1);
        } else {
          const wasDone = was
            ? was.topics.filter((t) => t.completed === 1).length
            : 0;
          const nowDone = block.topics.filter((t) => t.completed === 1).length;
          if (nowDone > wasDone) {
            setBlockPulse((p) => ({
              ...p,
              [block.id]: (p[block.id] ?? 0) + 1,
            }));
            setPulseKey((k) => k + 1);
          }
        }
      }
      const all = nextBlocks.flatMap((b) => b.topics);
      const subjectDone =
        all.length > 0 && all.every((t) => t.completed === 1);
      if (prevSubjectDone.current === false && subjectDone) {
        setMilestone({
          id: `subject-${subjectId}-${Date.now()}`,
          message: `Matéria concluída: ${tree.subject.name}`,
        });
      }
      prevSubjectDone.current = subjectDone;
    } else {
      const all = nextBlocks.flatMap((b) => b.topics);
      prevSubjectDone.current =
        all.length > 0 && all.every((t) => t.completed === 1);
    }
    prevBlocks.current = nextBlocks;

    setBlocks(nextBlocks);
    setOpenBlocks((prev) => {
      const next = { ...prev };
      for (const b of tree.blocks) {
        if (next[b.id] === undefined) next[b.id] = true;
      }
      return next;
    });
    setLoading(false);
  }, [subjectId]);

  useEffect(() => {
    prevBlocks.current = null;
    prevSubjectDone.current = null;
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filter, subjectId]);

  const filteredBlocks = useMemo(
    () =>
      blocks
        .map((b) => ({
          ...b,
          topics: b.topics.filter((t) => matchesFilter(t, filter)),
        }))
        .filter((b) => filter === "todos" || b.topics.length > 0),
    [blocks, filter],
  );

  const totals = useMemo(() => {
    const all = blocks.flatMap((b) => b.topics);
    const completed = all.filter((t) => t.completed === 1).length;
    return { total: all.length, completed };
  }, [blocks]);

  const completedSelectableIds = useMemo(
    () =>
      blocks
        .flatMap((b) => b.topics)
        .filter((t) => t.completed === 1)
        .map((t) => t.id),
    [blocks],
  );

  const selectMode = filter === "concluidos";
  const selectedCount = selectedIds.size;
  const allCompletedSelected =
    completedSelectableIds.length > 0 &&
    completedSelectableIds.every((id) => selectedIds.has(id));

  const firstTourTopicId = useMemo(
    () => filteredBlocks.flatMap((b) => b.topics)[0]?.id ?? null,
    [filteredBlocks],
  );

  const nameDialogTitle = (() => {
    if (!nameDialog) return "";
    if (nameDialog.kind === "subject") return "Editar matéria";
    if (nameDialog.kind === "block") {
      return nameDialog.mode === "create" ? "Novo bloco" : "Editar bloco";
    }
    return nameDialog.mode === "create" ? "Novo tópico" : "Editar tópico";
  })();

  const nameDialogInitial =
    nameDialog?.kind === "subject"
      ? { name, tag }
      : nameDialog?.kind === "block" && nameDialog.mode === "edit"
        ? { name: nameDialog.name, tag: "" }
        : nameDialog?.kind === "topic" && nameDialog.mode === "edit"
          ? { name: nameDialog.name, tag: "" }
          : { name: "", tag: "" };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!name) {
    return (
      <div>
        <p>Matéria não encontrada.</p>
        <Link to="/" className="text-accent underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MilestoneCelebration
        event={milestone}
        onDone={() => setMilestone(null)}
      />

      <NameDialog
        open={nameDialog != null}
        title={nameDialogTitle}
        showTag={nameDialog?.kind === "subject"}
        initialName={nameDialogInitial.name}
        initialTag={nameDialogInitial.tag}
        namePlaceholder={
          nameDialog?.kind === "block"
            ? "Ex: Citologia"
            : nameDialog?.kind === "topic"
              ? "Ex: Membrana plasmática"
              : "Ex: Anatomia"
        }
        confirmLabel={
          nameDialog?.mode === "create" ? "Criar" : "Salvar"
        }
        busy={busy}
        onCancel={() => {
          if (!busy) setNameDialog(null);
        }}
        onConfirm={async ({ name: nextName, tag: nextTag }) => {
          if (!nameDialog) return;
          setBusy(true);
          try {
            if (nameDialog.kind === "subject") {
              await updateSubject(subjectId, {
                name: nextName,
                tag: nextTag ?? tag,
              });
            } else if (nameDialog.kind === "block") {
              if (nameDialog.mode === "create") {
                const created = await createBlock(subjectId, nextName);
                setOpenBlocks((prev) => ({ ...prev, [created.id]: true }));
              } else {
                await updateBlock(nameDialog.blockId, { name: nextName });
              }
            } else if (nameDialog.mode === "create") {
              await createTopic(nameDialog.blockId, nextName);
              setOpenBlocks((prev) => ({
                ...prev,
                [nameDialog.blockId]: true,
              }));
            } else {
              await updateTopicName(nameDialog.topicId, nextName);
            }
            setNameDialog(null);
            await refresh();
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmDialog
        open={confirm != null}
        title={
          confirm?.kind === "subject"
            ? "Excluir matéria?"
            : confirm?.kind === "block"
              ? "Excluir bloco?"
              : "Excluir tópico?"
        }
        message={
          confirm?.kind === "subject"
            ? `“${name}” e todo o conteúdo serão removidos (${confirm.blockCount} bloco${confirm.blockCount === 1 ? "" : "s"}, ${confirm.topicCount} tópico${confirm.topicCount === 1 ? "" : "s"}).`
            : confirm?.kind === "block"
              ? `“${confirm.name}” e ${confirm.topicCount} tópico${confirm.topicCount === 1 ? "" : "s"} serão removidos.`
              : confirm
                ? `“${confirm.name}” será removido permanentemente.`
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
            if (confirm.kind === "subject") {
              await deleteSubject(subjectId);
              setConfirm(null);
              navigate("/");
              return;
            }
            if (confirm.kind === "block") {
              await deleteBlock(confirm.blockId);
            } else {
              await deleteTopic(confirm.topicId);
            }
            setConfirm(null);
            await refresh();
          } finally {
            setBusy(false);
          }
        }}
      />

      <div>
        <Link
          to="/"
          className="font-mono text-[11px] uppercase tracking-wider text-accent"
        >
          ← Dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="font-serif text-3xl font-semibold">{name}</h1>
              <span className="font-mono text-xs text-accent">{tag}</span>
            </div>
            <p className="mt-2 font-mono text-xs text-muted">
              {totals.completed}/{totals.total} tópicos
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="ghost"
              className="h-auto px-2 py-1 text-xs"
              aria-label="Editar matéria"
              onClick={() => setNameDialog({ kind: "subject", mode: "edit" })}
            >
              <Pencil size={14} />
              Editar
            </Button>
            <Button
              variant="ghost"
              className="h-auto px-2 py-1 text-xs text-danger hover:border-danger hover:text-danger"
              aria-label="Excluir matéria"
              onClick={() =>
                setConfirm({
                  kind: "subject",
                  blockCount: blocks.length,
                  topicCount: totals.total,
                })
              }
            >
              <Trash2 size={14} />
              Excluir
            </Button>
          </div>
        </div>
        <ProgressBar
          value={totals.completed}
          max={totals.total}
          className="mt-3 max-w-md"
          pulseKey={pulseKey}
        />
      </div>

      <div
        data-tour="subject-filters"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3"
      >
        <SegmentedControl
          options={filters}
          value={filter}
          onChange={setFilter}
        />
        <Button
          variant="accent"
          className="h-auto px-3 py-1.5 text-xs"
          onClick={() => setNameDialog({ kind: "block", mode: "create" })}
        >
          <Plus size={14} />
          Adicionar bloco
        </Button>
      </div>

      {selectMode && completedSelectableIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface/30 px-4 py-3">
          <p className="font-mono text-xs text-muted">
            {selectedCount === 0
              ? "Selecione os tópicos para revisar"
              : `${selectedCount} selecionado${selectedCount === 1 ? "" : "s"}`}
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="h-auto px-3 py-1.5 text-xs"
              disabled={busy}
              onClick={() => {
                if (allCompletedSelected) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(completedSelectableIds));
                }
              }}
            >
              {allCompletedSelected ? "Limpar seleção" : "Selecionar todos"}
            </Button>
            <Button
              variant="accent"
              className="h-auto px-3 py-1.5 text-xs"
              disabled={busy || selectedCount === 0}
              onClick={async () => {
                setBusy(true);
                try {
                  await forceReviewsNow([...selectedIds]);
                  setSelectedIds(new Set());
                  await refresh();
                } finally {
                  setBusy(false);
                }
              }}
            >
              Colocar na fila de revisão
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {blocks.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface/30 px-4 py-8 text-center">
            <p className="text-sm text-muted">Nenhum bloco nesta matéria.</p>
            <Button
              variant="accent"
              className="mt-4 h-auto px-3 py-1.5 text-xs"
              onClick={() => setNameDialog({ kind: "block", mode: "create" })}
            >
              <Plus size={14} />
              Criar primeiro bloco
            </Button>
          </div>
        ) : filteredBlocks.length === 0 ? (
          <p className="text-sm text-muted">Nenhum tópico neste filtro.</p>
        ) : (
          filteredBlocks.map((block) => {
            const open = openBlocks[block.id] ?? true;
            const fullBlock = blocks.find((b) => b.id === block.id);
            const doneCount =
              fullBlock?.topics.filter((t) => t.completed === 1).length ?? 0;
            const totalCount = fullBlock?.topics.length ?? block.topics.length;
            return (
              <section
                key={block.id}
                className="rounded-[var(--radius-lg)] border border-border bg-surface/30"
              >
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenBlocks((prev) => ({
                        ...prev,
                        [block.id]: !open,
                      }))
                    }
                    className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-track"
                  >
                    {open ? (
                      <ChevronDown size={16} className="text-accent" />
                    ) : (
                      <ChevronRight size={16} className="text-accent" />
                    )}
                    <h2 className="font-serif text-lg font-semibold">
                      {block.name}
                    </h2>
                    <span className="ml-auto font-mono text-[11px] text-muted">
                      {doneCount}/{totalCount}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 pr-2">
                    <Button
                      variant="ghost"
                      className="h-auto px-2 py-1 text-xs"
                      aria-label={`Adicionar tópico em ${block.name}`}
                      onClick={() =>
                        setNameDialog({
                          kind: "topic",
                          mode: "create",
                          blockId: block.id,
                        })
                      }
                    >
                      <Plus size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-auto px-2 py-1 text-xs"
                      aria-label={`Editar ${block.name}`}
                      onClick={() =>
                        setNameDialog({
                          kind: "block",
                          mode: "edit",
                          blockId: block.id,
                          name: fullBlock?.name ?? block.name,
                        })
                      }
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-auto px-2 py-1 text-xs text-danger hover:border-danger hover:text-danger"
                      aria-label={`Excluir ${block.name}`}
                      onClick={() =>
                        setConfirm({
                          kind: "block",
                          blockId: block.id,
                          name: fullBlock?.name ?? block.name,
                          topicCount: totalCount,
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                {fullBlock && (
                  <div className="px-4 pb-2">
                    <ProgressBar
                      value={doneCount}
                      max={totalCount}
                      pulseKey={blockPulse[block.id]}
                    />
                  </div>
                )}
                <div
                  className="accordion-grid"
                  data-open={open ? "true" : "false"}
                >
                  <div className="accordion-inner">
                    <div className="border-t border-border px-4">
                      {block.topics.length === 0 ? (
                        <div className="py-4 text-center">
                          <p className="text-sm text-muted">
                            Nenhum tópico neste bloco.
                          </p>
                          <Button
                            variant="accent"
                            className="mt-3 h-auto px-3 py-1.5 text-xs"
                            onClick={() =>
                              setNameDialog({
                                kind: "topic",
                                mode: "create",
                                blockId: block.id,
                              })
                            }
                          >
                            <Plus size={14} />
                            Adicionar tópico
                          </Button>
                        </div>
                      ) : (
                        block.topics.map((topic) => (
                          <TopicRow
                            key={topic.id}
                            topic={topic}
                            subjectId={subjectId}
                            subjectName={name}
                            subjectTag={tag}
                            blockName={block.name}
                            tourTopic={topic.id === firstTourTopicId}
                            tourContent={topic.id === firstTourTopicId}
                            tourSummary={topic.id === firstTourTopicId}
                            onToggle={async (completed) => {
                              await setTopicCompleted(topic.id, completed);
                              await refresh();
                            }}
                            onPriority={async (priority: Priority) => {
                              await updateTopicPriority(topic.id, priority);
                              await refresh();
                            }}
                            onDifficulty={async (difficulty: Difficulty) => {
                              await updateTopicDifficulty(
                                topic.id,
                                difficulty,
                              );
                              await refresh();
                            }}
                            onContentSaved={async () => {
                              await refresh();
                            }}
                            onNotesSaved={async () => {
                              await refresh();
                            }}
                            selected={
                              selectMode ? selectedIds.has(topic.id) : false
                            }
                            onSelectChange={
                              selectMode
                                ? (next) => {
                                    setSelectedIds((prev) => {
                                      const copy = new Set(prev);
                                      if (next) copy.add(topic.id);
                                      else copy.delete(topic.id);
                                      return copy;
                                    });
                                  }
                                : undefined
                            }
                            onRename={() =>
                              setNameDialog({
                                kind: "topic",
                                mode: "edit",
                                topicId: topic.id,
                                name: topic.name,
                              })
                            }
                            onDelete={() =>
                              setConfirm({
                                kind: "topic",
                                topicId: topic.id,
                                name: topic.name,
                              })
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
