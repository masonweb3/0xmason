"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";

export function CopyCode({ code, label, className = "" }: { code: string; label: string; className?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("done");
    } catch {
      setState("failed"); // The code stays visible and selectable, so it can still be copied by hand.
    }
    setTimeout(() => setState("idle"), 1600);
  }
  return (
    <button type="button" className={`code-button ${className}`} onClick={copy} aria-label={`复制 ${label} ${code}`}>
      <span className="code-text">{code}</span>
      {state === "done" ? <Check size={14} weight="bold" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span className="sr-only" aria-live="polite">{state === "done" ? "已复制" : state === "failed" ? "复制失败，请手动选择邀请码" : ""}</span>
    </button>
  );
}
