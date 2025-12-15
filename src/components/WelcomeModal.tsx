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
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-chart-1/20 border border-border">
            <Beaker className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-chart-1" />
            Bem-vindo ao Contexto Live!
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-chart-1" />
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Versão multiplayer do jogo Contexto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {/* What is this */}
          <div className="rounded-lg bg-muted/50 p-3 sm:p-4 space-y-2 sm:space-y-3">
            <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              O que é isso?
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Descubra a palavra secreta através de palpites! Cada palpite recebe um ranking 
              baseado na <span className="text-foreground font-medium">proximidade semântica</span> com a palavra alvo.
              Quanto menor o número, mais perto você está!
            </p>
          </div>

          {/* Game Modes */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 sm:p-4 space-y-2 sm:space-y-3">
            <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              Dois Modos de Jogo
            </h4>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Badge variant="outline" className="gap-1 bg-primary/10 w-fit">
                  <Target className="w-3 h-3" />
                  Clássico
                </Badge>
                <span className="text-muted-foreground">~2.000 palavras (servidor próprio)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Badge variant="outline" className="gap-1 bg-chart-1/10 text-chart-1 border-chart-1/30 w-fit">
                  <Globe className="w-3 h-3" />
                  Contexto.me
                </Badge>
                <span className="text-muted-foreground">~50.000 palavras (API externa)</span>
              </div>
            </div>
          </div>

          {/* Multiplayer rules */}
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 sm:p-4 space-y-2">
            <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
              <Beaker className="w-4 h-4 shrink-0" />
              Regras Multiplayer
            </h4>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
              <li>👀 Você vê os rankings dos oponentes, mas não as palavras</li>
              <li>⚔️ Se dois jogadores chutarem a mesma palavra, ela é revelada!</li>
              <li>🏆 Ganha quem descobrir a palavra primeiro (rank #1)</li>
            </ul>
          </div>

          {/* Feedback request */}
          <div className="rounded-lg border border-chart-1/30 bg-chart-1/10 p-3 sm:p-4 space-y-2">
            <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-chart-1">
              <MessageSquareHeart className="w-4 h-4 shrink-0" />
              Seu feedback é importante!
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Estamos validando a mecânica multiplayer. Conte-nos o que achou!
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          {feedbackUrl && (
            <Button variant="outline" onClick={handleFeedback} className="gap-2 w-full sm:w-auto">
              <MessageSquareHeart className="w-4 h-4" />
              Enviar Feedback
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
          <Button onClick={handleClose} className="gap-2 w-full sm:w-auto">
            <Sparkles className="w-4 h-4" />
            Entendi, vamos jogar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
