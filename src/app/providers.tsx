"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Player } from "@/lib/types";
import { Toaster } from "@/components/ui/sonner";

interface PlayerContextType {
  player: Player | null;
  setNickname: (nickname: string) => void;
  isReady: boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}

function generatePlayerId(): string {
  return crypto.randomUUID();
}

export function Providers({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load player from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("contexto-player");
    if (stored) {
      try {
        setPlayer(JSON.parse(stored));
      } catch {
        // Invalid JSON, will create new player when nickname is set
      }
    }
    setIsReady(true);
  }, []);

  // Save player to localStorage when it changes
  useEffect(() => {
    if (player) {
      localStorage.setItem("contexto-player", JSON.stringify(player));
    }
  }, [player]);

  const setNickname = (nickname: string) => {
    const id = player?.id || generatePlayerId();
    setPlayer({ id, nickname });
  };

  return (
    <PlayerContext.Provider value={{ player, setNickname, isReady }}>
      {children}
      <Toaster position="top-center" richColors />
    </PlayerContext.Provider>
  );
}

