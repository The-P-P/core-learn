import { useEffect, useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { seedIfEmpty } from "./db/seed";
import { startStudyReminderLoop } from "./lib/study-reminders";
import { Dashboard } from "./pages/Dashboard";
import { NotesPage } from "./pages/Notes";
import { SettingsPage } from "./pages/Settings";
import { SubjectPage } from "./pages/Subject";
import { useStudyPrefsStore } from "./stores/studyPrefs";
import { useThemeStore } from "./stores/theme";

export default function App() {
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateStudyPrefs = useStudyPrefsStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrateTheme();
    hydrateStudyPrefs();
    void (async () => {
      try {
        await seedIfEmpty();
        setReady(true);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [hydrateTheme, hydrateStudyPrefs]);

  useEffect(() => {
    if (!ready) return;
    return startStudyReminderLoop();
  }, [ready]);

  if (error) {
    return (
      <div className="app-shell flex min-h-full items-center justify-center px-6 text-fg">
        <div className="max-w-md rounded-[var(--radius-xl)] border border-border bg-surface/60 p-6">
          <h1 className="font-serif text-2xl font-semibold">Core Learn</h1>
          <p className="mt-3 text-sm text-danger">
            Não foi possível iniciar o banco de dados.
          </p>
          <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-muted">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="app-shell flex min-h-full flex-col items-center justify-center gap-3 font-serif text-fg">
        <div className="h-1 w-32 overflow-hidden rounded-full border border-border">
          <div className="skeleton h-full w-full" />
        </div>
        <p>Preparando Core Learn...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="subject/:subjectId" element={<SubjectPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
