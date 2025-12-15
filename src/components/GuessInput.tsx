"use client";

import { useState, FormEvent, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { cn } from "@/lib/utils";

interface GuessInputProps {
  onSubmit: (word: string) => Promise<unknown>;
  disabled?: boolean;
}

export function GuessInput({ onSubmit, disabled }: GuessInputProps) {
  const [word, setWord] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isKeyboardVisible } = useKeyboardVisible();

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

  // Scroll input into view when typing (mobile keyboard UX)
  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current && word) {
      inputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [word]);

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
    <form
      onSubmit={handleSubmit}
      className={cn("flex gap-2", isKeyboardVisible && "md:static")}
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder="Digite sua palavra..."
        value={word}
        onChange={(e) => setWord(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled || isSubmitting}
        className="h-12 md:h-14 text-base md:text-lg flex-1 bg-background/50 font-medium"
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
        className="h-12 md:h-14 px-4 md:px-6"
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
