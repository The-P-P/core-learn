import {
  Bold,
  CheckSquare,
  Code,
  Download,
  Heading1,
  Italic,
  List,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { updateTopicContent, updateTopicNotes } from "../db/repository";
import type { TopicWithContext } from "../db/types";
import { exportSummaryPdf } from "../lib/markdown-pdf";
import { MarkdownPreview } from "./MarkdownPreview";
import { Button } from "./ui/Button";
import { SegmentedControl } from "./ui/SegmentedControl";

type Mode = "edit" | "preview";
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
export type MarkdownField = "notes" | "content";

export type SummaryTopic = Pick<
  TopicWithContext,
  | "id"
  | "name"
  | "notes"
  | "content"
  | "block_name"
  | "subject_id"
  | "subject_name"
  | "subject_tag"
>;

interface SummaryEditorProps {
  open: boolean;
  topic: SummaryTopic | null;
  /** Campo persistido: resumo do aluno ou conteúdo didático. */
  field?: MarkdownField;
  onClose: () => void;
  onSaved?: (value: string) => void;
}

function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string = before,
): { next: string; selStart: number; selEnd: number } {
  const selected = value.slice(start, end) || "texto";
  const next =
    value.slice(0, start) + before + selected + after + value.slice(end);
  return {
    next,
    selStart: start + before.length,
    selEnd: start + before.length + selected.length,
  };
}

function prefixLines(
  value: string,
  start: number,
  end: number,
  prefix: string,
): { next: string; selStart: number; selEnd: number } {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEndIdx = value.indexOf("\n", end);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  const block = value.slice(lineStart, lineEnd);
  const nextBlock = block
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line || ""}`))
    .join("\n");
  const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
  return {
    next,
    selStart: lineStart,
    selEnd: lineStart + nextBlock.length,
  };
}

function initialValue(topic: SummaryTopic, field: MarkdownField): string {
  return field === "content" ? (topic.content ?? "") : (topic.notes ?? "");
}

export function SummaryEditor({
  open,
  topic,
  field = "notes",
  onClose,
  onSaved,
}: SummaryEditorProps) {
  const [mode, setMode] = useState<Mode>("edit");
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedValueRef = useRef("");
  const topicIdRef = useRef<string | null>(null);
  const draftRef = useRef("");
  const fieldRef = useRef<MarkdownField>(field);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isContent = field === "content";
  const titleId = isContent ? "content-editor-title" : "summary-editor-title";

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    fieldRef.current = field;
  }, [field]);

  useEffect(() => {
    if (!open || !topic) return;
    const value = initialValue(topic, field);
    setDraft(value);
    draftRef.current = value;
    savedValueRef.current = value;
    topicIdRef.current = topic.id;
    setSaveState("idle");
    setMode(isContent && value.trim() ? "preview" : "edit");
    setExportError(null);
    // Reset only when opening or switching topic/field — not on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- topic fields read on open/id/field change
  }, [open, topic?.id, field]);

  async function persist(value: string): Promise<boolean> {
    if (!topicIdRef.current) return false;
    if (value === savedValueRef.current) {
      setSaveState("saved");
      return true;
    }
    setSaveState("saving");
    try {
      if (fieldRef.current === "content") {
        await updateTopicContent(topicIdRef.current, value);
      } else {
        await updateTopicNotes(topicIdRef.current, value);
      }
      savedValueRef.current = value;
      setSaveState("saved");
      onSaved?.(value);
      return true;
    } catch {
      setSaveState("error");
      return false;
    }
  }

  function scheduleSave(value: string) {
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(value);
    }, 400);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (saveTimer.current) {
          clearTimeout(saveTimer.current);
          saveTimer.current = null;
        }
        void persist(draftRef.current).then(() => onClose());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleClose() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    await persist(draftRef.current);
    onClose();
  }

  function applyEdit(
    transform: (
      value: string,
      start: number,
      end: number,
    ) => { next: string; selStart: number; selEnd: number },
  ) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const { next, selStart, selEnd } = transform(draft, start, end);
    setDraft(next);
    scheduleSave(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  }

  async function handleExport() {
    if (!topic) return;
    setExportError(null);
    setExporting(true);
    try {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      await persist(draftRef.current);
      const result = await exportSummaryPdf({
        title: topic.name,
        breadcrumb: `${topic.subject_tag} · ${topic.block_name}`,
        markdown: draftRef.current,
      });
      if (result === "cancelled") {
        /* user dismissed dialog */
      }
    } catch (e) {
      setExportError(`Falha ao exportar PDF: ${String(e)}`);
    } finally {
      setExporting(false);
    }
  }

  if (!open || !topic) return null;

  const statusLabel =
    saveState === "saving"
      ? "Salvando…"
      : saveState === "dirty"
        ? "Alterações pendentes"
        : saveState === "error"
          ? "Erro ao salvar"
          : saveState === "saved"
            ? "Salvo"
            : "Pronto";

  const subtitle = isContent
    ? `Conteúdo didático · ${statusLabel}`
    : `Resumo em Markdown · ${statusLabel}`;

  const placeholder = isContent
    ? "## Conceito\n\nExplique o essencial deste tópico.\n\n## Pontos-chave\n\n- ...\n"
    : "## Essencial\n\n- Conceito principal\n- Fórmula ou mecanismo\n- O que ainda preciso revisar\n";

  const emptyPreview = isContent
    ? "Escreva o conteúdo na aba Editar para pré-visualizar."
    : "Escreva o resumo na aba Editar para pré-visualizar.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-bg/80 p-3 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) void handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-4xl flex-col rounded-[var(--radius-xl)] border border-border bg-surface shadow-lg"
      >
        <header className="flex flex-wrap items-start gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-wider text-accent">
              {topic.subject_tag} · {topic.block_name}
            </div>
            <h2
              id={titleId}
              className="mt-1 font-serif text-xl font-semibold leading-snug"
            >
              {topic.name}
            </h2>
            <p className="mt-1 text-xs text-muted">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="accent"
              className="h-auto px-2 py-1.5 text-xs"
              disabled={exporting}
              onClick={() => void handleExport()}
            >
              <Download size={14} />
              {exporting ? "Exportando…" : "Exportar PDF"}
            </Button>
            <Button
              variant="ghost"
              className="h-auto px-2 py-1.5 text-xs"
              aria-label="Fechar editor"
              onClick={() => void handleClose()}
            >
              <X size={16} />
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2">
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={[
              { id: "edit", label: "Editar" },
              { id: "preview", label: "Pré-visualizar" },
            ]}
          />
          {mode === "edit" && (
            <div className="flex flex-wrap gap-1">
              <ToolbarButton
                label="Título"
                onClick={() =>
                  applyEdit((v, s, e) => prefixLines(v, s, e, "# "))
                }
              >
                <Heading1 size={14} />
              </ToolbarButton>
              <ToolbarButton
                label="Negrito"
                onClick={() =>
                  applyEdit((v, s, e) => wrapSelection(v, s, e, "**"))
                }
              >
                <Bold size={14} />
              </ToolbarButton>
              <ToolbarButton
                label="Itálico"
                onClick={() =>
                  applyEdit((v, s, e) => wrapSelection(v, s, e, "_"))
                }
              >
                <Italic size={14} />
              </ToolbarButton>
              <ToolbarButton
                label="Lista"
                onClick={() =>
                  applyEdit((v, s, e) => prefixLines(v, s, e, "- "))
                }
              >
                <List size={14} />
              </ToolbarButton>
              <ToolbarButton
                label="Checklist"
                onClick={() =>
                  applyEdit((v, s, e) => prefixLines(v, s, e, "- [ ] "))
                }
              >
                <CheckSquare size={14} />
              </ToolbarButton>
              <ToolbarButton
                label="Código"
                onClick={() =>
                  applyEdit((v, s, e) => wrapSelection(v, s, e, "`"))
                }
              >
                <Code size={14} />
              </ToolbarButton>
            </div>
          )}
        </div>

        {exportError && (
          <p className="border-b border-danger/40 bg-danger/5 px-4 py-2 text-xs text-danger">
            {exportError}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {mode === "edit" ? (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                const next = e.target.value;
                setDraft(next);
                scheduleSave(next);
              }}
              placeholder={placeholder}
              className="h-[min(60vh,520px)] w-full resize-y rounded-[var(--radius-md)] border border-border bg-track px-3 py-2 font-mono text-sm leading-relaxed"
              spellCheck
            />
          ) : (
            <MarkdownPreview
              markdown={draft}
              className="min-h-[min(60vh,520px)] rounded-[var(--radius-md)] border border-border bg-track px-4 py-3"
              emptyLabel={emptyPreview}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-border text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {children}
    </button>
  );
}
