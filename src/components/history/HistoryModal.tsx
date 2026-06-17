import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { fetchHistory, deleteHistoryItem, type HistoryItem } from "@/lib/history";
import {
  IconClock,
  IconLoader,
  IconTrash,
  IconChevronRight,
  IconDownload,
  IconScroll,
} from "@/icons";
import { cn } from "@/lib/cn";

/** Pretty, compact date like "17 Jun, 03:14". */
function when(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * The user's scan history — every prompt the tool produced, newest first.
 * Each row expands to reveal the full markdown prompt with copy / download.
 */
export function HistoryModal({ open, onClose }: Readonly<{ open: boolean; onClose: () => void }>) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setItems(null);
    fetchHistory().then(setItems);
  }, [open]);

  async function remove(id: string) {
    const ok = await deleteHistoryItem(id);
    if (ok) setItems((list) => (list ? list.filter((i) => i.id !== id) : list));
  }

  function download(item: HistoryItem) {
    const blob = new Blob([item.prompt ?? ""], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.host.replace(/\./g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl" label="Scan history">
      <div className="p-6">
        <div className="mb-1 flex items-center gap-2 text-accent">
          <IconScroll size={16} />
          <span className="font-mono text-[11px] uppercase tracking-wider">History</span>
        </div>
        <h2 className="mb-4 font-display text-xl font-semibold text-white">Your scans &amp; prompts</h2>

        {items === null ? (
          <div className="flex justify-center py-14 text-accent-2">
            <IconLoader size={22} className="spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <IconClock size={26} className="text-ink-faint" />
            <p className="text-[13.5px] text-ink-dim">
              No scans yet. Run a scan and it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto pr-1">
            {items.map((item) => {
              const expanded = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-line-soft bg-white/[0.02]"
                >
                  {/* Row header */}
                  <div className="flex items-center gap-3 p-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(expanded ? null : item.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <IconChevronRight
                        size={15}
                        className={cn(
                          "flex-shrink-0 text-ink-faint transition-transform",
                          expanded && "rotate-90",
                        )}
                      />
                      {/* Palette preview */}
                      <span className="flex flex-shrink-0 overflow-hidden rounded-sm">
                        {(item.colors ?? []).slice(0, 5).map((c, i) => (
                          <span key={`${c}-${i}`} className="h-4 w-3" style={{ background: c }} />
                        ))}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[13px] text-white">
                          {item.host}
                        </span>
                        {item.summary && (
                          <span className="block truncate text-[12px] text-ink-dim">
                            {item.summary}
                          </span>
                        )}
                      </span>
                    </button>
                    <span className="flex-shrink-0 whitespace-nowrap text-[11.5px] text-ink-faint">
                      {when(item.created_at)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label="Delete"
                      className="flex-shrink-0 rounded-sm p-1.5 text-ink-faint transition-colors hover:bg-white/[0.06] hover:text-rose"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>

                  {/* Expanded prompt */}
                  {expanded && (
                    <div className="border-t border-line-soft p-3">
                      {item.prompt ? (
                        <>
                          <pre className="mb-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-line-soft bg-black/30 p-3 font-mono text-[11.5px] leading-relaxed text-ink-soft">
                            {item.prompt}
                          </pre>
                          <div className="flex gap-2">
                            <CopyButton value={item.prompt} label="Copy prompt" />
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<IconDownload size={13} />}
                              onClick={() => download(item)}
                            >
                              Download .md
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-[12.5px] text-ink-dim">No prompt was saved for this scan.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
