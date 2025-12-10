"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayer } from "@/app/providers";
import { useRoom } from "@/hooks/useRoom";
import { GuessInput } from "@/components/GuessInput";
import { MyGuesses } from "@/components/MyGuesses";
import { RoomFeed } from "@/components/RoomFeed";
import { RoomHeader } from "@/components/RoomHeader";
import { GameEndStats } from "@/components/GameEndStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Target, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { player, isReady } = usePlayer();

  const {
    room,
    players,
    guesses,
    bestRank,
    isLoading,
    error,
    submitGuess,
    startGame,
  } = useRoom(roomId, player?.id || "");

  // Redirect to home if no player
  useEffect(() => {
    if (isReady && !player) {
      router.push("/");
    }
  }, [isReady, player, router]);

  // Loading state
  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando sala...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive">{error || "Sala não encontrada"}</p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Lobby
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if current player is host
  const currentPlayer = players.find(p => p.user_id === player?.id);
  const isHost = currentPlayer?.is_host || false;

  // Filter guesses
  const myGuesses = guesses.filter(g => g.user_id === player?.id);

  // Get winner info
  const winner = room.winner_id
    ? {
        id: room.winner_id,
        nickname: players.find(p => p.user_id === room.winner_id)?.nickname || "Jogador",
      }
    : null;

  // Get secret word (only available when game is finished)
  const secretWord = room.status === "finished" ? room.secret_word : null;

  // Game finished - show stats
  const isGameFinished = room.status === "finished" && winner && secretWord;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-1/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </Link>
            <h1 className="font-bold text-lg">
              Contexto <span className="text-chart-1">Live</span>
            </h1>
            <div className="text-sm text-muted-foreground">
              {player?.nickname}
            </div>
          </div>
          
          {!isGameFinished && (
            <RoomHeader
              room={room}
              players={players}
              bestRank={bestRank}
              isHost={isHost}
              onStartGame={startGame}
            />
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Game Finished - Show Stats */}
        {isGameFinished ? (
          <div className="max-w-3xl mx-auto">
            <GameEndStats
              winner={winner}
              secretWord={secretWord}
              guesses={guesses}
              players={players}
              currentUserId={player?.id || ""}
            />
          </div>
        ) : room.status === "waiting" ? (
          // Waiting room
          <div className="flex items-center justify-center h-[60vh]">
            <Card className="max-w-md w-full text-center">
              <CardContent className="pt-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h2 className="text-xl font-semibold">Aguardando jogadores...</h2>
                <p className="text-muted-foreground text-sm">
                  Compartilhe o código da sala para seus amigos entrarem
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Game arena
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-220px)]">
            {/* Left column - My Panel */}
            <Card className="flex flex-col border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Meus Palpites
                  {myGuesses.length > 0 && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({myGuesses.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 pt-4 min-h-0">
                {/* Guess input */}
                {room.status === "playing" && (
                  <GuessInput
                    onSubmit={submitGuess}
                    disabled={room.status !== "playing"}
                  />
                )}
                
                {/* My guesses list */}
                <div className="flex-1 min-h-0">
                  <MyGuesses guesses={myGuesses} />
                </div>
              </CardContent>
            </Card>

            {/* Right column - Room Feed */}
            <Card className="flex flex-col border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-chart-1" />
                  Feed da Sala
                  {guesses.length > 0 && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({guesses.length} palpites)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-4 min-h-0">
                <RoomFeed
                  guesses={guesses}
                  currentUserId={player?.id || ""}
                  winner={winner}
                  secretWord={secretWord}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
