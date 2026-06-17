import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@/icons";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class, e.g. "max-w-md". */
  className?: string;
  /** Hide the corner close button (e.g. when a flow must complete). */
  hideClose?: boolean;
  label?: string;
}

/**
 * Centered, accessible modal. Deliberately understated — a calm surface, a
 * hairline border and a soft backdrop. No coloured glow or gradients.
 */
export function Modal({ open, onClose, children, className, hideClose, label }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-md rounded-xl border border-line bg-bg-soft shadow-[0_24px_70px_rgba(0,0,0,0.5)]",
          "max-h-[calc(100dvh-2rem)] overflow-y-auto",
          className,
        )}
      >
        {!hideClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-sm text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <IconX size={16} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
