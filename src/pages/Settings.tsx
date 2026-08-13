import { getVersion } from "@tauri-apps/api/app";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import {
  exportProgress,
  importProgress,
  resetProgress,
} from "../db/repository";
import type { ProgressBackup } from "../db/types";
import {
  deleteCustomBackgroundFile,
  pickAndImportCustomBackground,
  resolveCustomMediaUrl,
} from "../lib/custom-backgrounds";
import { checkForAppUpdate } from "../lib/updater";
import { useStudyPrefsStore } from "../stores/studyPrefs";
import {
  ACCENTS,
  ACCENT_META,
  BUILTIN_BACKGROUND_META,
  BUILTIN_BACKGROUNDS,
  DENSITIES,
  DENSITY_META,
  useThemeStore,
  type Accent,
  type BackgroundId,
  type BuiltinBackground,
  type Density,
} from "../stores/theme";
import { useTourStore } from "../stores/tour";

export function SettingsPage() {
  const navigate = useNavigate();
  const startTour = useTourStore((s) => s.start);
  const {
    accent,
    density,
    backgroundId,
    backgroundDim,
    customBackgrounds,
    setAccent,
    setDensity,
    setBackgroundId,
    setBackgroundDim,
    addCustomBackground,
    removeCustomBackground,
  } = useThemeStore();
  const {
    dailyGoal,
    notificationsEnabled,
    reminderHour,
    setDailyGoal,
    setNotificationsEnabled,
    setReminderHour,
  } = useStudyPrefsStore();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState(0);
  const [appVersion, setAppVersion] = useState<string>("…");
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [importingBg, setImportingBg] = useState(false);
  const [customThumbs, setCustomThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    void getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion("desconhecida"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Record<string, string> = {};
      for (const bg of customBackgrounds) {
        const url = await resolveCustomMediaUrl(bg.path);
        if (url) next[bg.id] = url;
      }
      if (!cancelled) setCustomThumbs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [customBackgrounds]);

  async function handleAddBackground() {
    setError(null);
    setImportingBg(true);
    try {
      const bg = await pickAndImportCustomBackground();
      if (!bg) return;
      addCustomBackground(bg);
      setMessage(`Background “${bg.name}” adicionado.`);
    } catch (e) {
      setError(`Falha ao adicionar background: ${String(e)}`);
    } finally {
      setImportingBg(false);
    }
  }

  async function handleRemoveCustom(id: string, path: string) {
    setError(null);
    try {
      await deleteCustomBackgroundFile(path);
      removeCustomBackground(id);
      setMessage("Background customizado removido.");
    } catch (e) {
      setError(`Falha ao remover background: ${String(e)}`);
    }
  }

  async function handleExport() {
    setError(null);
    try {
      const data = await exportProgress();
      const path = await save({
        defaultPath: `core-learn-backup-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) return;
      await writeTextFile(path, JSON.stringify(data, null, 2));
      setMessage("Progresso exportado com sucesso.");
    } catch (e) {
      setError(`Falha ao exportar: ${String(e)}`);
    }
  }

  async function handleImport() {
    setError(null);
    try {
      const path = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path || Array.isArray(path)) return;
      const raw = await readTextFile(path);
      const data = JSON.parse(raw) as ProgressBackup;
      if (
        (data.version !== 1 && data.version !== 2) ||
        !Array.isArray(data.topics)
      ) {
        throw new Error("Arquivo de backup inválido.");
      }
      await importProgress(data);
      setMessage("Progresso importado com sucesso.");
    } catch (e) {
      setError(`Falha ao importar: ${String(e)}`);
    }
  }

  async function handleCheckUpdate() {
    setError(null);
    setMessage(null);
    setCheckingUpdate(true);
    try {
      const result = await checkForAppUpdate({ silent: false });
      if (result.status === "up-to-date") {
        setMessage("Você já está na versão mais recente.");
      } else if (result.status === "declined") {
        setMessage(`Atualização ${result.version} adiada.`);
      } else if (result.status === "available") {
        setMessage(`Nova versão ${result.version} disponível.`);
      } else if (result.status === "error") {
        setError(`Falha ao verificar atualização: ${result.message}`);
      }
    } finally {
      setCheckingUpdate(false);
    }
  }

  async function handleReset() {
    if (resetStep === 0) {
      setResetStep(1);
      setMessage("Clique novamente para confirmar o reset completo.");
      return;
    }
    if (resetStep === 1) {
      setResetStep(2);
      setMessage("Última confirmação: clique em “Confirmar reset”.");
      return;
    }
    try {
      await resetProgress();
      setResetStep(0);
      setMessage("Progresso resetado. A estrutura de conteúdo foi mantida.");
    } catch (e) {
      setError(`Falha ao resetar: ${String(e)}`);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Configurações</h1>
        <p className="mt-1 text-sm text-muted">
          Aparência, hábitos de estudo, backup e reset do progresso.
        </p>
      </div>

      <Panel data-tour="study-prefs" className="space-y-5">
        <div>
          <h2 className="font-serif text-xl font-semibold">Estudo</h2>
          <p className="mt-1 text-sm text-muted">
            Meta diária e lembretes no Windows enquanto o app estiver aberto.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
            Meta diária
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={1}
              max={50}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="h-[var(--control-h)] w-24 rounded-[var(--radius-md)] border border-border bg-track px-3 font-mono text-sm"
            />
            <span className="text-sm text-muted">
              conclusões ou revisões por dia
            </span>
          </div>
        </label>

        <div className="space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
            Notificações
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={notificationsEnabled}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`inline-flex h-[var(--control-h)] items-center gap-2 rounded-[var(--radius-md)] border px-3 text-xs transition-colors ${
              notificationsEnabled
                ? "border-accent text-accent"
                : "border-border text-muted hover:border-accent/60"
            }`}
          >
            {notificationsEnabled ? "Lembretes ligados" : "Lembretes desligados"}
          </button>
        </div>

        <label className="block space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
            Horário do lembrete
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={0}
              max={23}
              value={reminderHour}
              disabled={!notificationsEnabled}
              onChange={(e) => setReminderHour(Number(e.target.value))}
              className="h-[var(--control-h)] w-24 rounded-[var(--radius-md)] border border-border bg-track px-3 font-mono text-sm disabled:opacity-50"
            />
            <span className="text-sm text-muted">
              hora local (0–23), enquanto o app estiver aberto
            </span>
          </div>
        </label>
      </Panel>

      <Panel className="space-y-5">
        <div>
          <h2 className="font-serif text-xl font-semibold">Aparência</h2>
          <p className="mt-1 text-sm text-muted">
            Background, acento e densidade — mudanças aplicadas na hora.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-accent">
              Background
            </p>
            <p className="text-sm text-muted">
              Atmosfera principal do app em todas as telas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setBackgroundId("none")}
              aria-pressed={backgroundId === "none"}
              className={`overflow-hidden rounded-[var(--radius-md)] border text-left transition-colors ${
                backgroundId === "none"
                  ? "border-accent ring-1 ring-accent/40"
                  : "border-border hover:border-accent/60"
              }`}
            >
              <div className="flex aspect-video items-center justify-center bg-track text-xs text-muted">
                Nenhum
              </div>
              <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider">
                Cor sólida
              </div>
            </button>

            {BUILTIN_BACKGROUNDS.map((id: BuiltinBackground) => {
              const meta = BUILTIN_BACKGROUND_META[id];
              const selected = backgroundId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBackgroundId(id)}
                  aria-pressed={selected}
                  className={`overflow-hidden rounded-[var(--radius-md)] border text-left transition-colors ${
                    selected
                      ? "border-accent ring-1 ring-accent/40"
                      : "border-border hover:border-accent/60"
                  }`}
                >
                  <img
                    src={meta.thumb}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                  <div className="truncate px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider">
                    {meta.label}
                  </div>
                </button>
              );
            })}

            {customBackgrounds.map((bg) => {
              const id: BackgroundId = `custom:${bg.id}`;
              const selected = backgroundId === id;
              const thumb = customThumbs[bg.id];
              return (
                <div
                  key={bg.id}
                  className={`relative overflow-hidden rounded-[var(--radius-md)] border ${
                    selected
                      ? "border-accent ring-1 ring-accent/40"
                      : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setBackgroundId(id)}
                    aria-pressed={selected}
                    className="block w-full text-left"
                  >
                    {thumb ? (
                      bg.kind === "video" ? (
                        <video
                          src={thumb}
                          muted
                          playsInline
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <img
                          src={thumb}
                          alt=""
                          className="aspect-video w-full object-cover"
                        />
                      )
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-track text-xs text-muted">
                        Custom
                      </div>
                    )}
                    <div className="truncate px-2 py-1.5 pr-8 font-mono text-[10px] uppercase tracking-wider">
                      {bg.name}
                    </div>
                  </button>
                  <button
                    type="button"
                    title="Remover"
                    onClick={() => void handleRemoveCustom(bg.id, bg.path)}
                    className="absolute right-1 top-1 rounded-[var(--radius-sm)] border border-border bg-surface/80 p-1 text-muted hover:text-danger"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="accent"
              disabled={importingBg}
              onClick={() => void handleAddBackground()}
            >
              <span className="inline-flex items-center gap-2">
                <ImagePlus size={14} />
                {importingBg ? "Importando…" : "Adicionar foto/vídeo"}
              </span>
            </Button>
          </div>

          <label className="block space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
              Opacidade do véu ({Math.round(backgroundDim * 100)}%)
            </span>
            <input
              type="range"
              min={35}
              max={75}
              step={1}
              value={Math.round(backgroundDim * 100)}
              onChange={(e) => setBackgroundDim(Number(e.target.value) / 100)}
              disabled={backgroundId === "none"}
              className="w-full max-w-md accent-[var(--app-accent)] disabled:opacity-40"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-accent">
            Acento
          </p>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((id: Accent) => {
              const active = accent === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAccent(id)}
                  aria-pressed={active}
                  className={`inline-flex h-[var(--control-h)] items-center gap-2 rounded-[var(--radius-md)] border px-3 text-xs transition-colors ${
                    active
                      ? "border-accent text-accent"
                      : "border-border text-fg hover:border-accent/60"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-[var(--radius-sm)] border border-black/15"
                    style={{ background: ACCENT_META[id].color }}
                  />
                  {ACCENT_META[id].label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-accent">
            Densidade
          </p>
          <SegmentedControl<Density>
            value={density}
            onChange={setDensity}
            options={DENSITIES.map((id) => ({
              id,
              label: DENSITY_META[id].label,
            }))}
          />
        </div>
      </Panel>

      <Panel data-tour="backup" className="space-y-3">
        <h2 className="font-serif text-xl font-semibold">Backup</h2>
        <p className="text-sm text-muted">
          Exporte ou importe um JSON com progresso, conteúdo, resumos e
          histórico.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" onClick={() => void handleExport()}>
            Exportar progresso
          </Button>
          <Button variant="warning" onClick={() => void handleImport()}>
            Importar progresso
          </Button>
        </div>
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-serif text-xl font-semibold">Sobre / Atualizações</h2>
        <p className="text-sm text-muted">
          Versão instalada:{" "}
          <span className="font-mono text-fg">{appVersion}</span>
        </p>
        <p className="text-sm text-muted">
          O Core Learn verifica atualizações ao abrir. Você também pode checar
          manualmente — o progresso em AppData é mantido.
        </p>
        <Button
          variant="accent"
          disabled={checkingUpdate}
          onClick={() => void handleCheckUpdate()}
        >
          {checkingUpdate ? "Verificando…" : "Verificar atualizações"}
        </Button>
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-serif text-xl font-semibold">Ajuda</h2>
        <p className="text-sm text-muted">
          Refaça o passeio pelas telas principais do Core Learn.
        </p>
        <Button
          variant="accent"
          onClick={() => {
            navigate("/");
            void startTour();
          }}
        >
          Iniciar tour guiado
        </Button>
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-serif text-xl font-semibold">Resetar tudo</h2>
        <p className="text-sm text-muted">
          Apaga progresso, resumos e histórico. Mantém matérias, blocos, tópicos
          e conteúdo didático.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => void handleReset()}>
            {resetStep === 0 && "Resetar tudo"}
            {resetStep === 1 && "Confirmar (1/2)"}
            {resetStep === 2 && "Confirmar reset"}
          </Button>
          {resetStep > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setResetStep(0);
                setMessage(null);
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </Panel>

      {message && (
        <p className="text-sm text-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
