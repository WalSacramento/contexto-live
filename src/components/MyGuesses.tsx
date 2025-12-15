"use client";

import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RankBadge } from "./RankBadge";
import { Guess } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getRankColor } from "@/lib/rank-utils";
import { Clock, ChevronDown } from "lucide-react";

interface MyGuessesProps {
  guesses: Guess[];
  className?: string;
}

export function MyGuesses({ guesses, className }: MyGuessesProps) {
  const INITIAL_MOBILE_LIMIT = 10;
  const [showAll, setShowAll] = useState(false);

  // Get the last guess (most recent by created_at)
  const lastGuess = useMemo(() => {
    if (guesses.length === 0) return null;
    return [...guesses].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }, [guesses]);

  // Sort guesses by rank (best first)
  const sortedGuesses = useMemo(() => {
    return [...guesses].sort((a, b) => a.rank - b.rank);
  }, [guesses]);

  // Limit guesses on mobile unless "showAll" is true
  const displayedGuesses = useMemo(() => {
    if (sortedGuesses.length <= 1) return sortedGuesses;
    if (showAll) return sortedGuesses;
    return sortedGuesses.slice(0, INITIAL_MOBILE_LIMIT);
  }, [sortedGuesses, showAll]);

  const hasMore = sortedGuesses.length > INITIAL_MOBILE_LIMIT && !showAll;

  if (guesses.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground text-sm", className)}>
        Seus palpites aparecerão aqui
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full overscroll-contain", className)}>
      <div className="space-y-3 pr-4">
        {/* Last Guess - Always on top with highlight */}
        {lastGuess && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Último palpite</span>
            </div>
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border-2 transition-all animate-slide-in",
                getRankColor(lastGuess.rank),
                lastGuess.rank === 1 && "animate-winner"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground capitalize text-lg">
                  {lastGuess.word}
                </span>
                {lastGuess.is_revealed && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    revelada
                  </span>
                )}
              </div>
              <RankBadge rank={lastGuess.rank} />
            </div>
          </div>
        )}

        {/* Divider */}
        {sortedGuesses.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <div className="flex-1 h-px bg-border/50" />
            <span>Todos ({sortedGuesses.length})</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
        )}

        {/* All guesses sorted by rank */}
        {displayedGuesses.length > 1 && displayedGuesses.map((guess, index) => {
          const isLast = guess.id === lastGuess?.id;
          
          return (
            <div
              key={guess.id}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-lg border border-border/30 transition-all",
                getRankColor(guess.rank),
                isLast && "ring-1 ring-primary/30",
                guess.rank === 1 && "border-2"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-mono w-5">
                  {index + 1}.
                </span>
                <span className={cn(
                  "font-medium text-foreground capitalize text-sm",
                  isLast && "text-primary"
                )}>
                  {guess.word}
                </span>
                {isLast && (
                  <span className="text-[10px] text-primary bg-primary/10 px-1 py-0.5 rounded">
                    último
                  </span>
                )}
              </div>
              <RankBadge rank={guess.rank} showEmoji={false} className="text-xs" />
            </div>
          );
        })}

        {/* Ver mais button */}
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(true)}
            className="w-full mt-2 text-xs"
          >
            <ChevronDown className="w-3 h-3 mr-1" />
            Ver mais ({sortedGuesses.length - INITIAL_MOBILE_LIMIT} palpites)
          </Button>
        )}
      </div>
    </ScrollArea>
  );
}
