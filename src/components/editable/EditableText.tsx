import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onSubmit: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function EditableText({ value, onSubmit, className, placeholder }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSubmit(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        placeholder={placeholder}
        className={cn("h-auto py-1 px-2 bg-background", className)}
      />
    );
  }

  return (
    <button
      type="button"
      className={cn("text-left hover:underline decoration-dotted underline-offset-4", className)}
      onClick={() => setEditing(true)}
      aria-label="Editar texto"
    >
      {value || placeholder || "Sem título"}
    </button>
  );
}
