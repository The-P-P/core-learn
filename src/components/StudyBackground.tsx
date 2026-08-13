import { useEffect, useMemo, useState } from "react";
import { resolveCustomMediaUrl } from "../lib/custom-backgrounds";
import {
  BUILTIN_BACKGROUND_META,
  BUILTIN_BACKGROUNDS,
  useThemeStore,
  type BuiltinBackground,
} from "../stores/theme";

function isBuiltinId(id: string): id is BuiltinBackground {
  return (BUILTIN_BACKGROUNDS as readonly string[]).includes(id);
}

export function StudyBackground() {
  const backgroundId = useThemeStore((s) => s.backgroundId);
  const backgroundDim = useThemeStore((s) => s.backgroundDim);
  const customBackgrounds = useThemeStore((s) => s.customBackgrounds);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const [customUrl, setCustomUrl] = useState<string | null>(null);

  const custom = useMemo(() => {
    if (!backgroundId.startsWith("custom:")) return null;
    const id = backgroundId.slice("custom:".length);
    return customBackgrounds.find((c) => c.id === id) ?? null;
  }, [backgroundId, customBackgrounds]);

  const builtin = isBuiltinId(backgroundId)
    ? BUILTIN_BACKGROUND_META[backgroundId]
    : null;

  useEffect(() => {
    let cancelled = false;
    if (!custom) {
      setCustomUrl(null);
      return;
    }
    void resolveCustomMediaUrl(custom.path).then((url) => {
      if (!cancelled) setCustomUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [custom]);

  if (backgroundId === "none") return null;

  const dimPct = Math.round(backgroundDim * 100);
  const videoSrc =
    !reducedMotion && builtin
      ? builtin.video
      : !reducedMotion && custom?.kind === "video"
        ? customUrl
        : null;
  const imageSrc = builtin
    ? reducedMotion
      ? builtin.thumb
      : null
    : custom?.kind === "image"
      ? customUrl
      : reducedMotion && custom?.kind === "video"
        ? customUrl
        : null;

  if (!videoSrc && !imageSrc) {
    // Built-in with motion: video only; still render overlay if waiting
    if (!builtin && !custom) return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {videoSrc ? (
        <video
          key={videoSrc}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : imageSrc ? (
        <img
          key={imageSrc}
          className="absolute inset-0 h-full w-full object-cover"
          src={imageSrc}
          alt=""
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background: `color-mix(in srgb, var(--app-bg) ${dimPct}%, transparent)`,
        }}
      />
    </div>
  );
}
