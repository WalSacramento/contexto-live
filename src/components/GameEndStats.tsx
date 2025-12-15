"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GuessWithPlayer, RoomPlayer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getRankEmoji, getRankTier } from "@/lib/rank-utils";
import {
  Trophy,
  Target,
  Zap,
  MessageSquare,
  Swords,
  TrendingUp,
  Medal,
  Award,
  Flame,
  Home,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface GameEndStatsProps {
  roomId: string;
  winner: { id: string; nickname: string };
  secretWord: string;
  guesses: GuessWithPlayer[];
  players: RoomPlayer[];
  currentUserId: string;
  isHost: boolean;
  onRematch: () => Promise<void>;
}

interface PlayerStats {
  userId: string;
  nickname: string;
  totalGuesses: number;
  bestRank: number;
  avgRank: number;
  firstGuessRank: number;
  collisions: number;
}

export function GameEndStats({
  roomId,
  winner,
  secretWord,
  guesses,
  players,
  currentUserId,
  isHost,
  onRematch,
}: GameEndStatsProps) {
  const [isCreatingRematch, setIsCreatingRematch] = useState(false);

  // Calculate player statistics
  const playerStats = useMemo((): PlayerStats[] => {
    const statsMap = new Map<string, PlayerStats>();

    // Initialize all players
    players.forEach((p) => {
      statsMap.set(p.user_id, {
        userId: p.user_id,
        nickname: p.nickname || "Jogador",
        totalGuesses: 0,
        bestRank: Infinity,
        avgRank: 0,
        firstGuessRank: 0,
        collisions: 0,
      });
    });

    // Process guesses in chronological order
    const sortedGuesses = [...guesses].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sortedGuesses.forEach((guess) => {
      const stats = statsMap.get(guess.user_id);
      if (!stats) return;

      // First guess
      if (stats.totalGuesses === 0) {
        stats.firstGuessRank = guess.rank;
      }

      stats.totalGuesses += 1;
      stats.bestRank = Math.min(stats.bestRank, guess.rank);
      stats.avgRank = (stats.avgRank * (stats.totalGuesses - 1) + guess.rank) / stats.totalGuesses;

      if (guess.is_revealed) {
        stats.collisions += 1;
      }
    });

    return Array.from(statsMap.values()).filter((s) => s.totalGuesses > 0);
  }, [guesses, players]);

  // Find special achievements
  const achievements = useMemo(() => {
    if (playerStats.length === 0) return null;

    // Most guesses
    const mostGuesses = [...playerStats].sort((a, b) => b.totalGuesses - a.totalGuesses)[0];

    // Best average (most accurate)
    const bestAverage = [...playerStats].sort((a, b) => a.avgRank - b.avgRank)[0];

    // Best first guess (started hot)
    const bestFirstGuess = [...playerStats].sort((a, b) => a.firstGuessRank - b.firstGuessRank)[0];

    // Most collisions
    const mostCollisions = [...playerStats].sort((a, b) => b.collisions - a.collisions)[0];

    // Total collisions in game
    const totalCollisions = guesses.filter((g) => g.is_revealed).length;

    // Total guesses
    const totalGuesses = guesses.length;

    return {
      mostGuesses,
      bestAverage,
      bestFirstGuess,
      mostCollisions: mostCollisions.collisions > 0 ? mostCollisions : null,
      totalCollisions,
      totalGuesses,
    };
  }, [playerStats, guesses]);

  const isMe = (userId: string) => userId === currentUserId;
  const formatName = (userId: string, nickname: string) =>
    isMe(userId) ? "Você" : nickname;

  const handleRematch = async () => {
    setIsCreatingRematch(true);
    try {
      await onRematch();
    } finally {
      setIsCreatingRematch(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Winner Banner */}
      <Card className="overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5">
        <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6">
          <div className="text-center space-y-4 sm:space-y-6">
            {/* Trophy */}
            <div className="inline-block">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500" />
            </div>

            {/* Winner Name */}
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
                Vencedor
              </p>
              <h2 className={cn(
                "text-2xl sm:text-3xl font-bold",
                isMe(winner.id) ? "text-green-400" : "text-foreground"
              )}>
                {isMe(winner.id) ? "🎉 Você venceu!" : `${winner.nickname}`}
              </h2>
            </div>

            {/* Secret Word */}
            <div className="pt-2 sm:pt-4 space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm text-muted-foreground">A palavra secreta era:</p>
              
              {/* Word container */}
              <div className="inline-block px-4 py-3 sm:px-8 sm:py-4 bg-green-500/10 rounded-xl border border-green-500/30">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wide text-green-400 break-all">
                  {secretWord}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {achievements && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Total Guesses */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-2 sm:px-4 text-center">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-primary mb-1 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold">{achievements.totalGuesses}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Palpites totais</p>
            </CardContent>
          </Card>

          {/* Total Collisions */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-2 sm:px-4 text-center">
              <Swords className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-chart-1 mb-1 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold">{achievements.totalCollisions}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Colisões</p>
            </CardContent>
          </Card>

          {/* Most Accurate Average */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-2 sm:px-4 text-center">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-rank-hot mb-1 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold">#{Math.round(achievements.bestAverage.avgRank)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Melhor média</p>
              <p className={cn(
                "text-[10px] sm:text-xs font-medium mt-1 truncate",
                isMe(achievements.bestAverage.userId) && "text-primary"
              )}>
                {formatName(achievements.bestAverage.userId, achievements.bestAverage.nickname)}
              </p>
            </CardContent>
          </Card>

          {/* Started Hottest */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-2 sm:px-4 text-center">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-orange-500 mb-1 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold">#{achievements.bestFirstGuess.firstGuessRank}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Melhor 1º chute</p>
              <p className={cn(
                "text-[10px] sm:text-xs font-medium mt-1 truncate",
                isMe(achievements.bestFirstGuess.userId) && "text-primary"
              )}>
                {formatName(achievements.bestFirstGuess.userId, achievements.bestFirstGuess.nickname)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Player Achievements */}
      {achievements && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {/* Most Persistent */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-purple-500/20 shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold">Mais Persistente</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Quem mais chutou palavras
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-none",
                    isMe(achievements.mostGuesses.userId) && "text-primary"
                  )}>
                    {formatName(achievements.mostGuesses.userId, achievements.mostGuesses.nickname)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {achievements.mostGuesses.totalGuesses} palpites
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Most Accurate */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-rank-hot/20 shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-rank-hot" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold">Mais Assertivo</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Melhor média de ranking
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-none",
                    isMe(achievements.bestAverage.userId) && "text-primary"
                  )}>
                    {formatName(achievements.bestAverage.userId, achievements.bestAverage.nickname)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    média #{Math.round(achievements.bestAverage.avgRank)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best First Guess */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-orange-500/20 shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold">Começou Quente</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Melhor primeiro palpite
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-none",
                    isMe(achievements.bestFirstGuess.userId) && "text-primary"
                  )}>
                    {formatName(achievements.bestFirstGuess.userId, achievements.bestFirstGuess.nickname)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    #{achievements.bestFirstGuess.firstGuessRank} {getRankEmoji(achievements.bestFirstGuess.firstGuessRank)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Most Collisions */}
          {achievements.mostCollisions && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-full bg-chart-1/20 shrink-0">
                    <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-chart-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold">Mais Colisões</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Pensou igual aos outros
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-none",
                      isMe(achievements.mostCollisions.userId) && "text-primary"
                    )}>
                      {formatName(achievements.mostCollisions.userId, achievements.mostCollisions.nickname)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {achievements.mostCollisions.collisions} colisões
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Player Ranking */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-4">
          <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Medal className="w-4 h-4 text-yellow-500 shrink-0" />
            Classificação Final
          </h3>
          <div className="space-y-1.5 sm:space-y-2">
            {[...playerStats]
              .sort((a, b) => a.bestRank - b.bestRank)
              .map((player, index) => {
                const tier = getRankTier(player.bestRank);
                const isWinner = player.userId === winner.id;
                
                return (
                  <div
                    key={player.userId}
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all",
                      isWinner && "bg-rank-winner/10 border border-rank-winner/30",
                      isMe(player.userId) && !isWinner && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    {/* Position */}
                    <div className="w-6 sm:w-8 text-center shrink-0">
                      {index === 0 ? (
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mx-auto" />
                      ) : index === 1 ? (
                        <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mx-auto" />
                      ) : index === 2 ? (
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mx-auto" />
                      ) : (
                        <span className="text-xs sm:text-sm text-muted-foreground">{index + 1}º</span>
                      )}
                    </div>

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs sm:text-sm font-medium truncate",
                        isMe(player.userId) && "text-primary",
                        isWinner && "text-rank-winner"
                      )}>
                        {formatName(player.userId, player.nickname)}
                        {isWinner && " 🏆"}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {player.totalGuesses} palpites • média #{Math.round(player.avgRank)}
                      </p>
                    </div>

                    {/* Best rank */}
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-sm sm:text-base font-mono font-bold",
                        tier === "winner" && "text-rank-winner",
                        tier === "hot" && "text-rank-hot",
                        tier === "warm" && "text-rank-warm",
                        tier === "cold" && "text-rank-cold"
                      )}>
                        #{player.bestRank}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">melhor</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4">
        {/* Rematch Button (only for host) */}
        {isHost && (
          <Button
            onClick={handleRematch}
            disabled={isCreatingRematch}
            size="lg"
            className="gap-2"
            variant="default"
          >
            {isCreatingRematch ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Criando sala...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Jogar Novamente
              </>
            )}
          </Button>
        )}

        {/* Back to Lobby Button */}
        <Button asChild size="lg" className="gap-2" variant="outline">
          <Link href="/">
            <Home className="w-4 h-4" />
            Voltar ao Lobby
          </Link>
        </Button>
      </div>
    </div>
  );
}

