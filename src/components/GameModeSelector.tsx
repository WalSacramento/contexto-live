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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-1/20 border border-border">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Escolha o Modo de Jogo</DialogTitle>
          <DialogDescription>
            Selecione qual dicionário você quer usar para esta partida
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
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
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{mode.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {mode.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Palavras:</span>
                    <span className="font-semibold">{mode.words}</span>
                  </div>
                  
                  <ul className="space-y-1.5">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="h-3 w-3 text-chart-1" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full mt-2" 
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

