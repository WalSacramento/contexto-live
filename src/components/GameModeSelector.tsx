"use client";

import { GameMode } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Globe, Sparkles, Server, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameModeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: GameMode) => void;
  isLoading?: boolean;
}

const GAME_MODES = [
  {
    id: "classic" as GameMode,
    name: "Clássico",
    icon: Target,
    description: "Nosso dicionário próprio",
    words: "~2.000",
    features: [
      "Palavras em português",
      "Servidor próprio",
      "Mais rápido",
    ],
  },
  {
    id: "contexto" as GameMode,
    name: "Contexto.me",
    icon: Globe,
    description: "Dicionário completo do Contexto original",
    words: "~50.000",
    features: [
      "Mesmo do jogo original",
      "Muito mais palavras",
      "Maior desafio",
    ],
  },
];

export function GameModeSelector({
  open,
  onOpenChange,
  onSelect,
  isLoading,
}: GameModeSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-1/20 border border-border">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <DialogTitle className="text-lg sm:text-xl">Escolha o Modo de Jogo</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Selecione qual dicionário você quer usar para esta partida
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-2 sm:py-4">
          {GAME_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card
                key={mode.id}
                className={cn(
                  "relative cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                  "group"
                )}
                onClick={() => !isLoading && onSelect(mode.id)}
              >
                <CardHeader className="pb-2 p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-base">{mode.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {mode.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Server className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Palavras:</span>
                    <span className="font-semibold">{mode.words}</span>
                  </div>
                  
                  <ul className="space-y-1 sm:space-y-1.5">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Zap className="h-3 w-3 text-chart-1 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full mt-2 text-xs sm:text-sm h-9 sm:h-10" 
                    variant={mode.id === "classic" ? "default" : "outline"}
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando..." : "Selecionar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

