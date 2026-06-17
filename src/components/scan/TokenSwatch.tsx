import { useState } from "react";
import type { ColorToken } from "@/lib/types";

/** A single color token chip that copies its hex on click. */
export function TokenSwatch({ token }: { token: ColorToken }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token.hex);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* no-op */
    }
  }

  return (
    <button
      onClick={copy}
      title={`Copy ${token.hex}`}
      className="group flex flex-col gap-2 rounded-md border border-line-soft bg-white/[0.02] p-2 text-left transition-colors hover:border-line"
    >
      <span
        className="h-9 w-full rounded-sm ring-1 ring-inset ring-white/10"
        style={{ background: token.hex }}
      />
      <span className="w-full">
        <span className="block text-[12px] font-medium leading-tight text-ink break-words">
          {token.name}
        </span>
        <span className="mt-0.5 block font-mono text-[10.5px] text-ink-dim">
          {copied ? "copied!" : token.hex}
        </span>
      </span>
    </button>
  );
}
