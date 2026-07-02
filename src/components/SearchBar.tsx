"use client";

import { useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  variant?: "hero" | "default";
}

export function SearchBar({
  value,
  onChange,
  id = "main-search",
  variant = "default",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isHero = variant === "hero";

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        if (value) onChange("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [value, onChange]);

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`group flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.07] px-4 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-[border-color,box-shadow,background-color] focus-within:border-neon/35 focus-within:bg-white/[0.1] focus-within:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_0_0_3px_rgba(109,180,232,0.12)] ${
          isHero ? "py-1" : ""
        }`}
      >
        <svg
          className="h-[18px] w-[18px] shrink-0 text-muted-dim transition-colors group-focus-within:text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={inputRef}
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search tools, categories, tags…"
          className={`min-w-0 flex-1 bg-transparent text-white placeholder:text-muted-dim focus:outline-none ${
            isHero ? "py-3.5 text-[16px]" : "py-2.5 text-[15px]"
          }`}
          aria-label="Search tools"
        />

        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="hover-subtle-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:text-white"
            aria-label="Clear search"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <kbd className="kbd-hint hidden shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] text-muted-dim sm:inline">
            /
          </kbd>
        )}
      </label>
    </div>
  );
}
