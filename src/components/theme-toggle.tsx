"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Desktop, Moon, Sun } from "@phosphor-icons/react";

const options = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Desktop },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent | FocusEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-control" ref={container}>
      <button
        className="theme-trigger"
        type="button"
        ref={trigger}
        onClick={() => setOpen(!open)}
        aria-label="选择网站主题"
        aria-expanded={open}
        aria-controls="theme-options"
        title="选择网站主题"
      >
        <Moon size={23} className="light-only" aria-hidden="true" />
        <Sun size={23} className="dark-only" aria-hidden="true" />
      </button>
      {open && (
        <div className="theme-menu" id="theme-options" role="group" aria-label="网站外观">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              key={value}
              aria-pressed={theme === value}
              onClick={() => {
                setTheme(value);
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
              <Check size={17} aria-hidden="true" className={theme === value ? "" : "invisible"} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
