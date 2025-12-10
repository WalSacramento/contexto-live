"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RankBadge } from "./RankBadge";
import { Guess } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getRankColor } from "@/lib/rank-utils";

interface MyGuessesProps {
  guesses: Guess[];
  className?: string;
}

export function MyGuesses({ guesses, className }: MyGuessesProps) {
  // Sort by rank (best first)
  const sortedGuesses = useMemo(() => {
    return [...guesses].sort((a, b) => a.rank - b.rank);
  }, [guesses]);

  if (sortedGuesses.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground text-sm", className)}>
        Seus palpites aparecerão aqui
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-2 pr-4">
        {sortedGuesses.map((guess, index) => (
          <div
            key={guess.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border border-border/50 transition-all",
              index === 0 && "animate-slide-in",
              getRankColor(guess.rank),
              guess.rank === 1 && "animate-winner border-2"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-xs font-mono w-6">
                {sortedGuesses.indexOf(guess) + 1}.
              </span>
              <span className="font-medium text-foreground capitalize">
                {guess.word}
              </span>
              {guess.is_revealed && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  revelada
                </span>
              )}
            </div>
            <RankBadge rank={guess.rank} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

