import { BookOpen, Check, FileText, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Difficulty, Priority, Topic } from "../db/types";
import { cn } from "../lib/cn";
import {
  SummaryEditor,
  type MarkdownField,
  type SummaryTopic,
} from "./SummaryEditor";
import { Button } from "./ui/Button";
import { Checkbox } from "./ui/Checkbox";
import { IntensityBars, MetaChip } from "./ui/MetaChip";

interface TopicRowProps {
  topic: Topic;
  subjectId: string;
  subjectName: string;
  subjectTag: string;
  blockName: string;
  onToggle: (completed: boolean) => void;
  onPriority: (priority: Priority) => void;
  onDifficulty: (difficulty: Difficulty) => void;
  onNotesSaved?: (notes: string) => void;
  onContentSaved?: (content: string) => void;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onRename?: () => void;
  onDelete?: () => void;
  /** Marca a linha como alvo do tour (primeiro tópico visível). */
  tourTopic?: boolean;
  /** Marca o botão de resumo como alvo do tour. */
  tourSummary?: boolean;
  /** Marca o botão de conteúdo como alvo do tour. */
  tourContent?: boolean;
}

const priorityTone: Record<Priority, "danger" | "warning" | "muted"> = {
  alta: "danger",
  media: "warning",
  baixa: "muted",
};

const priorityOptions: { id: Priority; label: string }[] = [
  { id: "alta", label: "Alta" },
  { id: "media", label: "Média" },
  { id: "baixa", label: "Baixa" },
];

const difficultyLevel: Record<Difficulty, 1 | 2 | 3> = {
  facil: 1,
  media: 2,
  dificil: 3,
};

const difficultyOptions: {
  id: Difficulty;
  label: string;
  hint: ReactNode;
}[] = [
  { id: "facil", label: "Fácil", hint: <IntensityBars level={1} /> },
  { id: "media", label: "Média", hint: <IntensityBars level={2} /> },
  { id: "dificil", label: "Difícil", hint: <IntensityBars level={3} /> },
];

export function TopicRow({
  topic,
  subjectId,
  subjectName,
  subjectTag,
  blockName,
  onToggle,
  onPriority,
  onDifficulty,
  onNotesSaved,
  onContentSaved,
  selected = false,
  onSelectChange,
  onRename,
  onDelete,
  tourTopic = false,
  tourSummary = false,
  tourContent = false,
}: TopicRowProps) {
  const [editorField, setEditorField] = useState<MarkdownField | null>(null);
  const [localNotes, setLocalNotes] = useState(topic.notes ?? "");
  const [localContent, setLocalContent] = useState(topic.content ?? "");
  const done = topic.completed === 1;
  const hasSummary = Boolean((localNotes || topic.notes || "").trim());
  const hasContent = Boolean((localContent || topic.content || "").trim());

  useEffect(() => {
    setLocalNotes(topic.notes ?? "");
    setLocalContent(topic.content ?? "");
  }, [topic.id, topic.notes, topic.content]);

  const editorTopic: SummaryTopic = {
    id: topic.id,
    name: topic.name,
    notes: localNotes || topic.notes || "",
    content: localContent || topic.content || "",
    block_name: blockName,
    subject_id: subjectId,
    subject_name: subjectName,
    subject_tag: subjectTag,
  };

  return (
    <div
      data-tour={tourTopic ? "subject-topic" : undefined}
      className={cn(
        "relative border-b border-border/70 py-[var(--space-row)] last:border-b-0",
        // Avoid row-level opacity: it creates a stacking context that buries popovers under later rows.
        done && "text-muted",
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        {onSelectChange != null && (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Selecionar para revisar: ${topic.name}`}
            onClick={() => onSelectChange(!selected)}
            className={cn(
              "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition-colors",
              selected
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-transparent hover:border-accent",
            )}
          >
            <Check
              size={12}
              strokeWidth={3}
              className={cn(
                "transition-opacity duration-150",
                selected ? "opacity-100" : "opacity-0",
              )}
            />
          </button>
        )}

        <Checkbox
          checked={done}
          onChange={onToggle}
          label={topic.name}
          className="min-w-0 flex-1"
        />

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <MetaChip
            ariaLabel="Prioridade"
            value={topic.priority}
            options={priorityOptions}
            onChange={onPriority}
            tone={priorityTone[topic.priority]}
          />

          <MetaChip
            ariaLabel="Dificuldade"
            value={topic.difficulty}
            options={difficultyOptions}
            onChange={onDifficulty}
            tone="neutral"
            leading={<IntensityBars level={difficultyLevel[topic.difficulty]} />}
          />

          <button
            type="button"
            data-tour={tourContent ? "subject-content" : undefined}
            onClick={() => {
              setLocalContent(topic.content ?? "");
              setEditorField("content");
            }}
            aria-label={hasContent ? "Abrir conteúdo" : "Escrever conteúdo"}
            title="Conteúdo didático"
            className={cn(
              "relative inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] border transition-colors",
              editorField === "content" || hasContent
                ? "border-accent text-accent"
                : "border-border text-muted hover:border-accent/50 hover:text-accent",
            )}
          >
            <BookOpen size={14} />
            {hasContent && (
              <span
                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden
              />
            )}
          </button>

          <button
            type="button"
            data-tour={tourSummary ? "subject-summary" : undefined}
            onClick={() => {
              setLocalNotes(topic.notes ?? "");
              setEditorField("notes");
            }}
            aria-label={hasSummary ? "Abrir resumo" : "Escrever resumo"}
            title="Resumo"
            className={cn(
              "relative inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] border transition-colors",
              editorField === "notes" || hasSummary
                ? "border-accent text-accent"
                : "border-border text-muted hover:border-accent/50 hover:text-accent",
            )}
          >
            <FileText size={14} />
            {hasSummary && (
              <span
                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden
              />
            )}
          </button>

          {onRename && (
            <Button
              variant="ghost"
              className="h-7 w-7 px-0 text-xs"
              aria-label={`Renomear ${topic.name}`}
              onClick={onRename}
            >
              <Pencil size={14} />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              className="h-7 w-7 px-0 text-xs text-danger hover:border-danger hover:text-danger"
              aria-label={`Excluir ${topic.name}`}
              onClick={onDelete}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      <SummaryEditor
        open={editorField != null}
        field={editorField ?? "notes"}
        topic={editorField != null ? editorTopic : null}
        onClose={() => setEditorField(null)}
        onSaved={(value) => {
          if (editorField === "content") {
            setLocalContent(value);
            onContentSaved?.(value);
          } else {
            setLocalNotes(value);
            onNotesSaved?.(value);
          }
        }}
      />
    </div>
  );
}
