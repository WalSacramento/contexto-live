"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Beaker, BookOpen, MessageSquareHeart, Sparkles, ExternalLink, Target, Globe } from "lucide-react";

const STORAGE_KEY = "contexto-welcome-seen-v2";

interface WelcomeModalProps {
  feedbackUrl?: string;
}

export function WelcomeModal({ feedbackUrl }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the modal
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleFeedback = () => {
    if (feedbackUrl) {
      window.open(feedbackUrl, "_blank");
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-chart-1/20 border border-border">
            <Beaker className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-chart-1" />
            Bem-vindo ao Contexto Live!
            <Sparkles className="w-5 h-5 text-chart-1" />
          </DialogTitle>
          <DialogDescription className="text-base">
            Versão multiplayer do jogo Contexto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What is this */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              O que é isso?
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Descubra a palavra secreta através de palpites! Cada palpite recebe um ranking 
              baseado na <span className="text-foreground font-medium">proximidade semântica</span> com a palavra alvo.
              Quanto menor o número, mais perto você está!
            </p>
          </div>

          {/* Game Modes */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Dois Modos de Jogo
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1 bg-primary/10">
                  <Target className="w-3 h-3" />
                  Clássico
                </Badge>
                <span className="text-muted-foreground">~2.000 palavras (servidor próprio)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1 bg-chart-1/10 text-chart-1 border-chart-1/30">
                  <Globe className="w-3 h-3" />
                  Contexto.me
                </Badge>
                <span className="text-muted-foreground">~50.000 palavras (API externa)</span>
              </div>
            </div>
          </div>

          {/* Multiplayer rules */}
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
              <Beaker className="w-4 h-4" />
              Regras Multiplayer
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>👀 Você vê os rankings dos oponentes, mas não as palavras</li>
              <li>⚔️ Se dois jogadores chutarem a mesma palavra, ela é revelada!</li>
              <li>🏆 Ganha quem descobrir a palavra primeiro (rank #1)</li>
            </ul>
          </div>

          {/* Feedback request */}
          <div className="rounded-lg border border-chart-1/30 bg-chart-1/10 p-4 space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-chart-1">
              <MessageSquareHeart className="w-4 h-4" />
              Seu feedback é importante!
            </h4>
            <p className="text-sm text-muted-foreground">
              Estamos validando a mecânica multiplayer. Conte-nos o que achou!
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {feedbackUrl && (
            <Button variant="outline" onClick={handleFeedback} className="gap-2">
              <MessageSquareHeart className="w-4 h-4" />
              Enviar Feedback
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
          <Button onClick={handleClose} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Entendi, vamos jogar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
