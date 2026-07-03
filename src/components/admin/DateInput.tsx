"use client";

import { useRef } from "react";

interface DateInputProps {
  className?: string;
  value: string;
  onChange: (value: string) => void;
}

export function DateInput({ className = "", value, onChange }: DateInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = ref.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.focus();
    }
  }

  return (
    <input
      ref={ref}
      type="date"
      className={`admin-date-input ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={openPicker}
    />
  );
}
