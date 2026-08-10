import { useEffect, useId, useState } from "react";
import { Button } from "./ui/Button";

interface NameDialogProps {
  open: boolean;
  title: string;
  nameLabel?: string;
  namePlaceholder?: string;
  initialName?: string;
  /** When set, shows a tag field (for matérias). */
  showTag?: boolean;
  tagLabel?: string;
  initialTag?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: (value: { name: string; tag?: string }) => void;
  onCancel: () => void;
}

export function NameDialog({
  open,
  title,
  nameLabel = "Nome",
  namePlaceholder,
  initialName = "",
  showTag = false,
  tagLabel = "Tag",
  initialTag = "",
  confirmLabel = "Salvar",
  cancelLabel = "Cancelar",
  busy = false,
  onConfirm,
  onCancel,
}: NameDialogProps) {
  const nameId = useId();
  const tagId = useId();
  const [name, setName] = useState(initialName);
  const [tag, setTag] = useState(initialTag);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setTag(initialTag);
  }, [open, initialName, initialTag]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  // Create: tag optional (repo defaults). Edit: tag required when field is shown.
  const submitDisabled =
    busy ||
    !name.trim() ||
    (showTag && Boolean(initialTag) && !tag.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 px-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-dialog-title"
        className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-lg"
        onSubmit={(e) => {
          e.preventDefault();
          if (submitDisabled) return;
          onConfirm(
            showTag
              ? { name: name.trim(), tag: tag.trim() || undefined }
              : { name: name.trim() },
          );
        }}
      >
        <h2
          id="name-dialog-title"
          className="font-serif text-xl font-semibold"
        >
          {title}
        </h2>

        <label
          htmlFor={nameId}
          className="mt-4 block font-mono text-[11px] uppercase tracking-wider text-muted"
        >
          {nameLabel}
        </label>
        <input
          id={nameId}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={namePlaceholder}
          autoFocus
          disabled={busy}
          className="mt-1 w-full border border-border bg-track px-3 py-2 text-sm focus:border-accent"
        />

        {showTag && (
          <>
            <label
              htmlFor={tagId}
              className="mt-3 block font-mono text-[11px] uppercase tracking-wider text-muted"
            >
              {tagLabel}
              {!initialTag && (
                <span className="ml-1 normal-case tracking-normal text-muted/80">
                  (opcional)
                </span>
              )}
            </label>
            <input
              id={tagId}
              value={tag}
              onChange={(e) => setTag(e.target.value.slice(0, 8))}
              placeholder="Ex: BIO"
              disabled={busy}
              maxLength={8}
              className="mt-1 w-full border border-border bg-track px-3 py-2 font-mono text-sm uppercase focus:border-accent"
            />
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button type="submit" variant="accent" disabled={submitDisabled}>
            {busy ? "Aguarde…" : confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
