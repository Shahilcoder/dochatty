"use client";

import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatComposer({
  onSend,
  disabled,
  placeholder = "Ask a question about your document…",
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function autoGrow(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  return (
    <div className="flex items-end gap-2 bg-surface-container-low border border-outline-variant/60 focus-within:border-neon-blue rounded-lg p-2 transition-colors">
      <textarea
        ref={ref}
        value={value}
        onChange={autoGrow}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent resize-none outline-none text-on-surface placeholder:text-outline px-2 py-1.5 text-[15px] max-h-[200px]"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className={cn(
          "size-9 grid place-items-center rounded-md shrink-0 transition-all",
          "bg-neon-blue text-pure-white hover:shadow-glow-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none",
        )}
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  );
}
