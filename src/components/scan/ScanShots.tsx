import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconImage, IconX, IconChevronLeft, IconChevronRight, IconMaximize } from "@/icons";

/**
 * Shows the full-page screenshots the scan actually captured, so the user
 * can see exactly what was analysed. The page is grabbed top-to-bottom in
 * several frames; the first is shown as a clickable preview and the rest are
 * reachable in a full-screen lightbox with close (×) + left/right arrows.
 */
export function ScanShots({ shots, host }: { shots: string[]; host: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const count = shots.length;
  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  // Keyboard navigation + body scroll lock while the lightbox is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go]);

  if (count === 0) return null;

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  return (
    <>
      <div className="rounded-xl border border-line-soft bg-white/[0.015] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent">
            <IconImage size={16} />
            <h3 className="font-display text-sm font-semibold text-white">What the scan saw</h3>
          </div>
          <span className="font-mono text-[11px] text-ink-faint">
            full page · {count} frame{count > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {shots.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openAt(i)}
              className="group relative shrink-0 overflow-hidden rounded-lg border border-line-soft bg-black/20 transition-colors hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              aria-label={`Open screenshot ${i + 1} of ${count}`}
            >
              <img
                src={src}
                alt={`${host} — captured frame ${i + 1}`}
                className="h-40 w-auto max-w-[260px] object-cover object-top"
                loading="lazy"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
                <span className="flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                  <IconMaximize size={13} /> View
                </span>
              </span>
              <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur">
                {i + 1}/{count}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-ink-dim">
          The scanner scrolls the full page top-to-bottom — click a frame to see exactly what was analysed.
        </p>
      </div>

      {open &&
        createPortal(
          <div
            className="fade-up fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            {/* Close (×) — top right */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/90 transition-colors hover:bg-white/15 sm:right-6 sm:top-6"
              aria-label="Close"
            >
              <IconX size={20} />
            </button>

            {/* Counter */}
            <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 font-mono text-[12px] text-white/85 backdrop-blur sm:top-7">
              {index + 1} / {count}
            </div>

            {/* Prev */}
            {count > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/90 transition-colors hover:bg-white/15 sm:left-5"
                aria-label="Previous screenshot"
              >
                <IconChevronLeft size={22} />
              </button>
            )}

            {/* Image (scrollable for very tall captures) */}
            <div
              className="max-h-full max-w-5xl overflow-auto rounded-xl border border-white/10 bg-black/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={shots[index]}
                alt={`${host} — captured frame ${index + 1} of ${count}`}
                className="block h-auto w-full"
              />
            </div>

            {/* Next */}
            {count > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/90 transition-colors hover:bg-white/15 sm:right-5"
                aria-label="Next screenshot"
              >
                <IconChevronRight size={22} />
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
