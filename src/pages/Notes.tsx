import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  SummaryEditor,
  type SummaryTopic,
} from "../components/SummaryEditor";
import { listNotes } from "../db/repository";
import type { TopicWithContext } from "../db/types";
import { staggerContainer, staggerItem } from "../lib/motion";
import { useThemeStore } from "../stores/theme";

type Group = {
  subjectId: string;
  subjectName: string;
  subjectTag: string;
  blocks: {
    blockName: string;
    topics: TopicWithContext[];
  }[];
};

function groupNotes(rows: TopicWithContext[]): Group[] {
  const bySubject = new Map<string, Group>();
  for (const topic of rows) {
    let subject = bySubject.get(topic.subject_id);
    if (!subject) {
      subject = {
        subjectId: topic.subject_id,
        subjectName: topic.subject_name,
        subjectTag: topic.subject_tag,
        blocks: [],
      };
      bySubject.set(topic.subject_id, subject);
    }
    let block = subject.blocks.find((b) => b.blockName === topic.block_name);
    if (!block) {
      block = { blockName: topic.block_name, topics: [] };
      subject.blocks.push(block);
    }
    block.topics.push(topic);
  }
  return [...bySubject.values()];
}

function plainPreview(markdown: string, max = 160): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trimEnd()}…`;
}

export function NotesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TopicWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorTopic, setEditorTopic] = useState<SummaryTopic | null>(null);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await listNotes(query);
        if (!cancelled) setResults(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query.trim() ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  const groups = useMemo(() => groupNotes(results), [results]);

  async function refreshList() {
    const rows = await listNotes(query);
    setResults(rows);
  }

  return (
    <div className="space-y-6" data-tour="notes">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Resumos</h1>
        <p className="mt-1 text-sm text-muted">
          Biblioteca dos resumos por tópico — busque, abra e exporte em PDF.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filtrar por tópico, matéria ou conteúdo…"
        className="w-full max-w-xl rounded-[var(--radius-md)] border border-border bg-surface/50 px-3 py-2 text-sm transition-shadow focus:border-accent"
        autoFocus
      />

      {loading && results.length === 0 && (
        <p className="text-sm text-muted">Carregando resumos…</p>
      )}

      {!loading && results.length === 0 && !query.trim() && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface/30 px-5 py-8">
          <p className="font-serif text-lg font-semibold">
            Nenhum resumo ainda
          </p>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Abra uma matéria, escolha um tópico e escreva o essencial no botão
            Resumo. Os textos aparecem aqui para revisão rápida perto das
            provas.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block font-mono text-[11px] uppercase tracking-wider text-accent underline-offset-2 hover:underline"
          >
            Ir ao dashboard
          </Link>
        </div>
      )}

      {!loading && results.length === 0 && query.trim() && (
        <p className="text-sm text-muted">
          Nenhum resumo para “{query}”.
        </p>
      )}

      <motion.div
        className="space-y-8"
        variants={reducedMotion ? undefined : staggerContainer}
        initial={reducedMotion ? false : "initial"}
        animate="animate"
        key={`${query}:${results.length}`}
      >
        {groups.map((group) => (
          <motion.section
            key={group.subjectId}
            variants={reducedMotion ? undefined : staggerItem}
            className="space-y-3"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                {group.subjectTag}
              </span>
              <h2 className="font-serif text-xl font-semibold">
                {group.subjectName}
              </h2>
            </div>

            {group.blocks.map((block) => (
              <div
                key={`${group.subjectId}-${block.blockName}`}
                className="space-y-2"
              >
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  {block.blockName}
                </h3>
                <ul className="divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-surface/30">
                  {block.topics.map((topic) => (
                    <li key={topic.id}>
                      <button
                        type="button"
                        onClick={() => setEditorTopic(topic)}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-track/60"
                      >
                        <div className="font-medium text-fg">{topic.name}</div>
                        <p className="mt-1 text-sm text-muted">
                          {plainPreview(topic.notes)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.section>
        ))}
      </motion.div>

      <SummaryEditor
        open={!!editorTopic}
        topic={editorTopic}
        onClose={() => setEditorTopic(null)}
        onSaved={() => {
          void refreshList();
        }}
      />
    </div>
  );
}
