import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { appLocalDataDir, basename, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import {
  BaseDirectory,
  copyFile,
  exists,
  mkdir,
  remove,
} from "@tauri-apps/plugin-fs";
import type {
  CustomBackground,
  CustomBackgroundKind,
} from "../stores/theme";

const DIR = "backgrounds";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXTS = new Set(["mp4", "webm"]);

function extOf(path: string): string {
  const base = path.split(/[/\\]/).pop() ?? path;
  const i = base.lastIndexOf(".");
  return i >= 0 ? base.slice(i + 1).toLowerCase() : "";
}

function kindFromExt(ext: string): CustomBackgroundKind | null {
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  return null;
}

async function ensureDir() {
  const already = await exists(DIR, { baseDir: BaseDirectory.AppLocalData });
  if (!already) {
    await mkdir(DIR, {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    });
  }
}

export async function resolveCustomMediaUrl(
  absolutePath: string,
): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    return convertFileSrc(absolutePath);
  } catch {
    return null;
  }
}

export async function absoluteCustomPath(fileName: string): Promise<string> {
  const root = await appLocalDataDir();
  return join(root, DIR, fileName);
}

export async function pickAndImportCustomBackground(): Promise<CustomBackground | null> {
  if (!isTauri()) {
    throw new Error("Adicionar background customizado exige o app desktop.");
  }

  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Imagem ou vídeo",
        extensions: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm"],
      },
    ],
  });
  if (!selected || Array.isArray(selected)) return null;

  const sourcePath = selected;
  const ext = extOf(sourcePath);
  const kind = kindFromExt(ext);
  if (!kind) {
    throw new Error("Formato não suportado. Use foto (jpg/png/webp) ou vídeo (mp4/webm).");
  }

  await ensureDir();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const fileName = `${id}.${ext === "jpeg" ? "jpg" : ext}`;
  const destRel = `${DIR}/${fileName}`;

  await copyFile(sourcePath, destRel, {
    toPathBaseDir: BaseDirectory.AppLocalData,
  });

  const path = await absoluteCustomPath(fileName);
  const name = (await basename(sourcePath)).replace(/\.[^.]+$/, "") || "Background";

  return { id, name, kind, path };
}

export async function deleteCustomBackgroundFile(
  absolutePath: string,
): Promise<void> {
  if (!isTauri()) return;
  try {
    const root = await appLocalDataDir();
    const prefix = await join(root, DIR);
    if (!absolutePath.startsWith(prefix)) return;
    const fileName = absolutePath.slice(prefix.length).replace(/^[/\\]/, "");
    if (!fileName || fileName.includes("..")) return;
    const rel = `${DIR}/${fileName.replace(/\\/g, "/")}`;
    if (await exists(rel, { baseDir: BaseDirectory.AppLocalData })) {
      await remove(rel, { baseDir: BaseDirectory.AppLocalData });
    }
  } catch {
    /* ignore missing files */
  }
}
