"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RankBadge } from "./RankBadge";
import { GuessWithPlayer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { maskWord, getRankTier, getRankEmoji } from "@/lib/rank-utils";
import { Swords, Trophy, EyeOff, Crown, Medal, Award } from "lucide-react";

interface RoomFeedProps {
  guesses: GuessWithPlayer[];
  currentUserId: string;
  winner?: { id: string; nickname: string } | null;
  secretWord?: string | null;
  className?: string;
}

interface PlayerRanking {
  user_id: string;
  nickname: string;
  bestRank: number;
  totalGuesses: number;
}

export function RoomFeed({ guesses, currentUserId, winner, secretWord, className }: RoomFeedProps) {
  // Sort by time (newest FIRST), but bump recently revealed collisions to top
  const sortedGuesses = useMemo(() => {
    const now = Date.now();
    const COLLISION_HIGHLIGHT_DURATION = 10000; // 10 seconds to stay on top

    return [...guesses].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      
      // Check if collision is recent (within highlight duration)
      const aIsRecentCollision = a.is_revealed && (now - timeA) < COLLISION_HIGHLIGHT_DURATION;
      const bIsRecentCollision = b.is_revealed && (now - timeB) < COLLISION_HIGHLIGHT_DURATION;

      // Recent collisions go to top
      if (aIsRecentCollision && !bIsRecentCollision) return -1;
      if (!aIsRecentCollision && bIsRecentCollision) return 1;

      // Otherwise, sort by time (newest first)
      return timeB - timeA;
    });
  }, [guesses]);

  // Calculate player rankings (best rank per player)
  const playerRankings = useMemo((): PlayerRanking[] => {
    const rankingMap = new Map<string, PlayerRanking>();

    guesses.forEach((guess) => {
      const existing = rankingMap.get(guess.user_id);
      if (!existing) {
        rankingMap.set(guess.user_id, {
          user_id: guess.user_id,
          nickname: guess.nickname || "Jogador",
          bestRank: guess.rank,
          totalGuesses: 1,
        });
      } else {
        rankingMap.set(guess.user_id, {
          ...existing,
          bestRank: Math.min(existing.bestRank, guess.rank),
          totalGuesses: existing.totalGuesses + 1,
        });
      }
    });

    // Sort by best rank (lowest first)
    return Array.from(rankingMap.values()).sort((a, b) => a.bestRank - b.bestRank);
  }, [guesses]);

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 1:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 2:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="w-4 text-center text-xs text-muted-foreground">{position + 1}</span>;
    }
  };

  // Check if a guess is a recent collision (for highlighting)
  const isRecentCollision = (guess: GuessWithPlayer) => {
    if (!guess.is_revealed) return false;
    const now = Date.now();
    const guessTime = new Date(guess.created_at).getTime();
    return (now - guessTime) < 10000; // 10 seconds
  };

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-3 pr-4">
        {/* Winner announcement */}
        {winner && secretWord && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-rank-winner/20 to-chart-1/20 border border-rank-winner/30 animate-winner">
            <div className="flex items-center gap-3 text-center justify-center">
              <Trophy className="w-6 h-6 text-rank-winner" />
              <div>
                <p className="font-bold text-lg">
                  {winner.id === currentUserId ? "Você venceu!" : `${winner.nickname} venceu!`}
                </p>
                <p className="text-sm text-muted-foreground">
                  A palavra era: <span className="font-bold text-foreground capitalize">{secretWord}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Player Rankings Leaderboard */}
        {playerRankings.length > 0 && !winner && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold">Ranking Atual</span>
            </div>
            <div className="space-y-2">
              {playerRankings.slice(0, 5).map((player, index) => {
                const isMe = player.user_id === currentUserId;
                const tier = getRankTier(player.bestRank);
                
                return (
                  <div
                    key={player.user_id}
                    className={cn(
                      "flex items-center justify-between gap-2 p-2 rounded-md transition-all",
                      isMe && "bg-primary/10 border border-primary/20",
                      index === 0 && "bg-yellow-500/10"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getRankingIcon(index)}
                      <span className={cn(
                        "text-sm font-medium truncate",
                        isMe && "text-primary"
                      )}>
                        {isMe ? "Você" : player.nickname}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({player.totalGuesses} {player.totalGuesses === 1 ? "palpite" : "palpites"})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{getRankEmoji(player.bestRank)}</span>
                      <span className={cn(
                        "font-mono text-sm font-bold",
                        tier === "winner" && "text-rank-winner",
                        tier === "hot" && "text-rank-hot",
                        tier === "warm" && "text-rank-warm",
                        tier === "cold" && "text-rank-cold"
                      )}>
                        #{player.bestRank}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        {playerRankings.length > 0 && sortedGuesses.length > 0 && !winner && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border/50" />
            <span>Últimos palpites</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
        )}

        {sortedGuesses.length === 0 && !winner && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Os palpites da sala aparecerão aqui
          </div>
        )}

        {sortedGuesses.map((guess, index) => {
          const isMe = guess.user_id === currentUserId;
          const showWord = isMe || guess.is_revealed;
          const tier = getRankTier(guess.rank);
          const isHot = tier === "hot" || tier === "winner";
          const recentCollision = isRecentCollision(guess);
          
          return (
            <div
              key={guess.id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                index === 0 && "animate-slide-in",
                // Default styles
                "border-border/30",
                // My guesses
                isMe && "bg-primary/5 border-primary/20",
                // Revealed (collision) - subtle highlight
                guess.is_revealed && !recentCollision && "border-chart-1/20 bg-chart-1/5",
                // Recent collision - strong highlight
                recentCollision && "border-2 border-chart-1/50 bg-chart-1/15 shadow-lg shadow-chart-1/10"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Collision indicator for recent collisions */}
                    {recentCollision && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-chart-1 bg-chart-1/20 px-1.5 py-0.5 rounded">
                        <Swords className="w-3 h-3" />
                        COLISÃO!
                      </span>
                    )}
                    
                    {/* Player indicator */}
                    <span className={cn(
                      "text-sm font-medium truncate",
                      isMe ? "text-primary" : "text-muted-foreground"
                    )}>
                      {isMe ? "Você" : guess.nickname}
                    </span>
                    
                    {/* Revealed/Hidden indicator (only for non-recent collisions) */}
                    {!isMe && !recentCollision && (
                      guess.is_revealed ? (
                        <span className="flex items-center gap-1 text-xs text-chart-1">
                          <Swords className="w-3 h-3" />
                          colisão
                        </span>
                      ) : (
                        <EyeOff className="w-3 h-3 text-muted-foreground/50" />
                      )
                    )}
                  </div>
                  
                  {/* Word or masked */}
                  <div className="flex items-center gap-2">
                    {showWord ? (
                      <span className={cn(
                        "font-medium capitalize",
                        recentCollision && "text-lg font-bold text-chart-1",
                        guess.is_revealed && !recentCollision && "text-chart-1"
                      )}>
                        {guess.word}
                      </span>
                    ) : (
                      <span className="font-mono text-muted-foreground tracking-wider">
                        {maskWord(guess.word)}
                      </span>
                    )}
                    
                    {/* Hot indicator for close guesses */}
                    {!isMe && isHot && !guess.is_revealed && (
                      <span className="text-sm">
                        {getRankEmoji(guess.rank)} 
                        <span className="text-xs text-muted-foreground ml-1">
                          está quente!
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                
                <RankBadge rank={guess.rank} showEmoji={isMe || showWord} />
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
