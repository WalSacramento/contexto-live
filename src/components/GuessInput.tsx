"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface GuessInputProps {
  onSubmit: (word: string) => Promise<unknown>;
  disabled?: boolean;
}

export function GuessInput({ onSubmit, disabled }: GuessInputProps) {
  const [word, setWord] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const trimmedWord = word.trim().toLowerCase();
    if (!trimmedWord || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedWord);
      setWord("");
    } finally {
      setIsSubmitting(false);
      // Keep focus on input after submit
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Digite sua palavra..."
        value={word}
        onChange={(e) => setWord(e.target.value)}
        disabled={disabled || isSubmitting}
        className="h-14 text-lg flex-1 bg-background/50 font-medium"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        autoFocus
      />
      <Button
        type="submit"
        size="lg"
        disabled={disabled || isSubmitting || !word.trim()}
        className="h-14 px-6"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </Button>
    </form>
  );
}
