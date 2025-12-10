"use client";

import { useState, FormEvent, useRef, useEffect, useCallback } from "react";
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

  // Function to focus the input
  const focusInput = useCallback(() => {
    if (!disabled && inputRef.current) {
      // Use setTimeout to ensure focus happens after any DOM updates
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [disabled]);

  // Auto-focus on mount and when disabled changes
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Re-focus when submitting ends
  useEffect(() => {
    if (!isSubmitting) {
      focusInput();
    }
  }, [isSubmitting, focusInput]);

  // Handle blur - restore focus after a short delay
  // This handles cases where toasts/modals steal focus
  const handleBlur = useCallback(() => {
    if (!disabled && !isSubmitting) {
      // Small delay to allow intentional clicks elsewhere
      setTimeout(() => {
        // Only re-focus if nothing else is focused or if body is focused
        if (document.activeElement === document.body || !document.activeElement) {
          inputRef.current?.focus();
        }
      }, 100);
    }
  }, [disabled, isSubmitting]);

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
      // Focus is handled by the useEffect above
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
        onBlur={handleBlur}
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
