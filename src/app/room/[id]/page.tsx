"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayer } from "@/app/providers";
import { useRoom } from "@/hooks/useRoom";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { GuessInput } from "@/components/GuessInput";
import { MyGuesses } from "@/components/MyGuesses";
import { RoomFeed } from "@/components/RoomFeed";
import { RoomHeader } from "@/components/RoomHeader";
import { GameEndStats } from "@/components/GameEndStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Loader2, ArrowLeft, Target, MessageSquare, Menu, Users, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  // Detect mobile keyboard visibility
  const { isKeyboardVisible } = useKeyboardVisible();

  // Menu hambúrguer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Handle rematch creation
  const handleRematch = async () => {
    if (!player?.id || !isHost) {
      toast.error("Apenas o host pode criar rematch");
      return;
    }

    try {
      // Call rematch API
      const response = await fetch("/api/rematch/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          userId: player.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao criar rematch");
        return;
      }

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Redirect to new room
      toast.success("Nova sala criada! Redirecionando...");
      router.push(`/room/${data.room_id}`);

    } catch (error) {
      console.error("Error creating rematch:", error);
      toast.error("Erro ao criar rematch");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-1/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className={cn(
        "border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10",
        isKeyboardVisible && "max-md:hidden"
      )}>
        <div className="container mx-auto px-4">
          {/* Mobile compact header durante o jogo */}
          {room.status === "playing" ? (
            <>
              {/* Compact header - mobile only */}
              <div className="md:hidden py-2 flex items-center justify-between">
                <h1 className="font-bold text-base">
                  Contexto <span className="text-chart-1">Live</span>
                </h1>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{players.length}</span>
                  </div>

                  <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Menu className="w-4 h-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="top" className="h-auto max-h-[85vh] overflow-y-auto px-4 pt-4 pb-6 [&>button]:hidden">
                      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border/30">
                        <SheetTitle className="text-base font-bold">
                          Contexto <span className="text-chart-1">Live</span>
                        </SheetTitle>

                        <div className="flex items-center gap-2">
                          <Link
                            href="/"
                            className="text-xs text-destructive hover:text-destructive/90 inline-flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors border border-destructive/30"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Sair
                          </Link>

                          <SheetClose asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-sm">
                              <X className="w-4 h-4" />
                              <span className="sr-only">Fechar</span>
                            </Button>
                          </SheetClose>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <RoomHeader
                          room={room}
                          players={players}
                          bestRank={bestRank}
                          isHost={isHost}
                          onStartGame={startGame}
                        />

                        {/* Jogadores na sala */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Jogadores na Sala
                          </h3>
                          <div className="space-y-2">
                            {players.map((p) => (
                              <div
                                key={p.user_id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border",
                                  p.user_id === player?.id
                                    ? "bg-primary/5 border-primary/20"
                                    : "bg-muted/30 border-border/50"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    "bg-green-500"
                                  )} />
                                  <span className={cn(
                                    "font-medium text-sm truncate max-w-[180px]",
                                    p.user_id === player?.id && "text-primary"
                                  )}>
                                    {p.nickname}
                                    {p.user_id === player?.id && " (Você)"}
                                  </span>
                                </div>
                                {p.is_host && (
                                  <Badge variant="secondary" className="text-xs">
                                    Host
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Full header - desktop */}
              <div className="hidden md:block py-4">
                <div className="flex items-center justify-between mb-4">
                  <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Sair</span>
                  </Link>
                  <h1 className="font-bold text-lg">
                    Contexto <span className="text-chart-1">Live</span>
                  </h1>
                  <div className="text-sm text-muted-foreground">
                    {player?.nickname?.slice(0, 20)}
                  </div>
                </div>

                <RoomHeader
                  room={room}
                  players={players}
                  bestRank={bestRank}
                  isHost={isHost}
                  onStartGame={startGame}
                />
              </div>
            </>
          ) : (
            /* Header completo para waiting/finished - todos os dispositivos */
            <div className="py-4">
              <div className="flex items-center justify-between mb-4">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Sair</span>
                </Link>
                <h1 className="font-bold text-lg">
                  Contexto <span className="text-chart-1">Live</span>
                </h1>
                <div className="text-sm text-muted-foreground">
                  {player?.nickname?.slice(0, 20)}
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
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Game Finished - Show Stats */}
        {isGameFinished ? (
          <div className="max-w-3xl mx-auto">
            <GameEndStats
              roomId={roomId}
              winner={winner}
              secretWord={secretWord}
              guesses={guesses}
              players={players}
              currentUserId={player?.id || ""}
              isHost={isHost}
              onRematch={handleRematch}
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
          <div className={cn(
            "grid gap-6 grid-cols-1 lg:grid-cols-2",
            isKeyboardVisible
              ? "h-[calc(100dvh-60px)] md:h-[calc(100vh-220px)]"
              : "h-[calc(100dvh-100px)] md:h-[calc(100vh-220px)]"
          )}>
            {/* Left column - My Panel */}
            <Card className="flex flex-col border-border/50 bg-card/50 backdrop-blur-sm order-1 lg:order-1">
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
                {/* Guess input - em cima no desktop, embaixo no mobile */}
                {room.status === "playing" && (
                  <div className="order-2 md:order-1">
                    <GuessInput
                      onSubmit={submitGuess}
                      disabled={room.status !== "playing"}
                    />
                  </div>
                )}

                {/* My guesses list - scroll */}
                <div className="flex-1 min-h-0 order-1 md:order-2">
                  <MyGuesses guesses={myGuesses} />
                </div>
              </CardContent>
            </Card>

            {/* Right column - Room Feed */}
            <Card className="flex flex-col border-border/50 bg-card/50 backdrop-blur-sm order-2 lg:order-2">
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
