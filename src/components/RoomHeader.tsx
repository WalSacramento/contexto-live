"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Room, RoomPlayer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Copy, Play, Users, Clock, Trophy, Check, Target, Globe } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface RoomHeaderProps {
  room: Room;
  players: RoomPlayer[];
  bestRank: number;
  isHost: boolean;
  onStartGame: () => Promise<boolean>;
  className?: string;
}

export function RoomHeader({
  room,
  players,
  bestRank,
  isHost,
  onStartGame,
  className,
}: RoomHeaderProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await onStartGame();
    } finally {
      setIsStarting(false);
    }
  };

  // Calculate progress (inverse of rank, capped at 100%)
  const progressValue = bestRank > 0 ? Math.max(0, 100 - Math.log10(bestRank) * 25) : 0;

  const statusConfig = {
    waiting: {
      label: "Aguardando",
      color: "bg-yellow-500/20 text-yellow-500",
      icon: Clock,
    },
    playing: {
      label: "Em andamento",
      color: "bg-green-500/20 text-green-500",
      icon: Play,
    },
    finished: {
      label: "Finalizado",
      color: "bg-blue-500/20 text-blue-500",
      icon: Trophy,
    },
  };

  const gameModeConfig = {
    classic: {
      label: "Clássico",
      icon: Target,
      color: "bg-primary/20 text-primary",
    },
    contexto: {
      label: "Contexto.me",
      icon: Globe,
      color: "bg-chart-1/20 text-chart-1",
    },
  };

  const status = statusConfig[room.status];
  const StatusIcon = status.icon;
  
  const gameMode = gameModeConfig[room.game_mode || "classic"];
  const GameModeIcon = gameMode.icon;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Room info */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Game mode badge */}
          <Badge variant="outline" className={cn("gap-1.5", gameMode.color)}>
            <GameModeIcon className="w-3 h-3" />
            {gameMode.label}
          </Badge>

          {/* Status badge */}
          <Badge variant="outline" className={cn("gap-1.5", status.color)}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{players.length} jogador{players.length !== 1 ? "es" : ""}</span>
          </div>
        </div>

        {/* Room code */}
        <Button
          variant="outline"
          size="sm"
          onClick={copyRoomCode}
          className="font-mono text-xs gap-2"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {room.id.slice(0, 8)}...
        </Button>
      </div>

      {/* Progress bar (only when playing) */}
      {room.status === "playing" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso da sala</span>
            {bestRank > 0 && (
              <span className="font-mono text-xs">
                Melhor: <span className="text-primary font-bold">#{bestRank}</span>
              </span>
            )}
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
      )}

      {/* Start game button (only for host in waiting room) */}
      {room.status === "waiting" && isHost && (
        <Button
          onClick={handleStartGame}
          disabled={isStarting || players.length < 1}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          <Play className="w-5 h-5 mr-2" />
          {isStarting ? "Iniciando..." : "Iniciar Jogo"}
        </Button>
      )}

      {/* Waiting message for non-hosts */}
      {room.status === "waiting" && !isHost && (
        <div className="text-center p-4 rounded-lg bg-muted/50 text-muted-foreground">
          Aguardando o host iniciar o jogo...
        </div>
      )}

      {/* Players list (in waiting room) */}
      {room.status === "waiting" && (
        <div className="flex flex-wrap gap-2">
          {players.map((player) => (
            <Badge key={player.user_id} variant="secondary" className="gap-1.5">
              {player.is_host && <span className="text-xs">👑</span>}
              {player.nickname}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
