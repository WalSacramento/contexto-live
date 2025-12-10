"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "./providers";
import { getSupabase } from "@/lib/supabase";
import { CreateRoomResponse, JoinRoomResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Sparkles, Users, Zap } from "lucide-react";
import { WelcomeModal } from "@/components/WelcomeModal";

export default function LobbyPage() {
  const router = useRouter();
  const { player, setNickname, isReady } = usePlayer();
  const [nicknameInput, setNicknameInput] = useState(player?.nickname || "");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const handleCreateRoom = async () => {
    if (!nicknameInput.trim()) {
      toast.error("Digite um nickname para continuar");
      return;
    }

    setNickname(nicknameInput.trim());
    setIsCreating(true);

    try {
      const supabase = getSupabase();
      const playerId = player?.id || crypto.randomUUID();
      
      const { data, error } = await supabase.rpc("create_room", {
        p_user_id: playerId,
        p_nickname: nicknameInput.trim(),
      });

      if (error) throw error;

      const response = data as CreateRoomResponse;
      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (response.room_id) {
        toast.success("Sala criada com sucesso!");
        router.push(`/room/${response.room_id}`);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Erro ao criar sala. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!nicknameInput.trim()) {
      toast.error("Digite um nickname para continuar");
      return;
    }

    if (!roomCode.trim()) {
      toast.error("Digite o código da sala");
      return;
    }

    setNickname(nicknameInput.trim());
    setIsJoining(true);

    try {
      const supabase = getSupabase();
      const playerId = player?.id || crypto.randomUUID();

      const { data, error } = await supabase.rpc("join_room", {
        p_room_id: roomCode.trim(),
        p_user_id: playerId,
        p_nickname: nicknameInput.trim(),
      });

      if (error) throw error;

      const response = data as JoinRoomResponse;
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Entrando na sala...");
      setJoinDialogOpen(false);
      router.push(`/room/${roomCode.trim()}`);
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Erro ao entrar na sala. Verifique o código.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Welcome Modal (PoC info) */}
      <WelcomeModal />

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-1/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-1/20 border border-border mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Contexto <span className="text-chart-1">Live</span>
          </h1>
          <p className="text-muted-foreground">
            Descubra a palavra secreta através da proximidade semântica
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Entre no jogo</CardTitle>
            <CardDescription>
              Escolha um nickname e crie ou entre em uma sala
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nickname Input */}
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium text-muted-foreground">
                Seu Nickname
              </label>
              <Input
                id="nickname"
                placeholder="Ex: CacadorDePalavras"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                className="h-12 text-lg bg-background/50"
                maxLength={20}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCreateRoom}
                disabled={isCreating || !nicknameInput.trim()}
                className="h-14 text-base font-semibold"
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                {isCreating ? "Criando..." : "Criar Sala"}
              </Button>

              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-14 text-base font-semibold"
                    size="lg"
                    disabled={!nicknameInput.trim()}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Entrar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Entrar em uma Sala</DialogTitle>
                    <DialogDescription>
                      Digite o código da sala que você recebeu
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Cole o código da sala aqui"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="font-mono text-center"
                    />
                    <Button
                      onClick={handleJoinRoom}
                      disabled={isJoining || !roomCode.trim()}
                      className="w-full"
                    >
                      {isJoining ? "Entrando..." : "Entrar na Sala"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* How to Play */}
        <Card className="border-border/30 bg-card/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Como Jogar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="text-lg">🎯</span>
              <p>Descubra a palavra secreta através de palpites</p>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">📊</span>
              <p>Cada palpite mostra um ranking - quanto menor, mais perto!</p>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">👀</span>
              <p>Você vê os rankings dos oponentes, mas não as palavras deles</p>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">⚔️</span>
              <p>Se dois jogadores chutarem a mesma palavra, ela é revelada!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
