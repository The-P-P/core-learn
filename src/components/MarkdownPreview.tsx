import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/cn";

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
  emptyLabel?: string;
}

export function MarkdownPreview({
  markdown,
  className,
  emptyLabel = "Nada para pré-visualizar ainda.",
}: MarkdownPreviewProps) {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return (
      <p className={cn("text-sm text-muted", className)}>{emptyLabel}</p>
    );
  }

  return (
    <div className={cn("md-preview", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
