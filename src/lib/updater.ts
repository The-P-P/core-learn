import { ask } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

export type UpdateCheckResult =
  | { status: "up-to-date" }
  | { status: "available"; version: string }
  | { status: "updated"; version: string }
  | { status: "declined"; version: string }
  | { status: "skipped" }
  | { status: "error"; message: string };

/**
 * Verifica atualizações no GitHub Releases.
 * Em modo silencioso (boot), falhas de rede são ignoradas.
 */
export async function checkForAppUpdate(options?: {
  /** Se true, não mostra diálogo quando já está atualizado / offline. */
  silent?: boolean;
}): Promise<UpdateCheckResult> {
  const silent = options?.silent ?? false;

  try {
    const update = await check();
    if (!update) {
      return { status: "up-to-date" };
    }

    const shouldInstall = await ask(
      `Nova versão ${update.version} disponível.\n\nDeseja atualizar agora? O app será reiniciado. Seu progresso local será mantido.`,
      {
        title: "Atualização — Core Learn",
        kind: "info",
        okLabel: "Atualizar",
        cancelLabel: "Depois",
      },
    );

    if (!shouldInstall) {
      return { status: "declined", version: update.version };
    }

    await update.downloadAndInstall();
    await relaunch();
    return { status: "updated", version: update.version };
  } catch (e) {
    if (silent) {
      return { status: "skipped" };
    }
    return { status: "error", message: String(e) };
  }
}
