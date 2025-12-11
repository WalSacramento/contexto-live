"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import { Room, RoomPlayer, GuessWithPlayer, SubmitGuessResponse, StartGameResponse } from "@/lib/types";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RoomState {
  room: Room | null;
  players: RoomPlayer[];
  guesses: GuessWithPlayer[];
  bestRank: number;
  isLoading: boolean;
  error: string | null;
}

interface UseRoomReturn extends RoomState {
  submitGuess: (word: string) => Promise<SubmitGuessResponse | null>;
  startGame: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useRoom(roomId: string, userId: string): UseRoomReturn {
  const [state, setState] = useState<RoomState>({
    room: null,
    players: [],
    guesses: [],
    bestRank: 0,
    isLoading: true,
    error: null,
  });

  // Use ref to track previous room status for comparison
  const prevRoomStatusRef = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Cache de players (userId -> nickname) para evitar N+1 queries
  const playersMapRef = useRef<Map<string, string>>(new Map());

  // Fetch room details
  const fetchRoomDetails = useCallback(async () => {
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase.rpc("get_room_details", {
        p_room_id: roomId,
      });

      if (error) throw error;

      const roomData = data as {
        room: Room;
        players: RoomPlayer[];
        guesses: GuessWithPlayer[];
      };

      // Calculate best rank
      const bestRank = roomData.guesses.length > 0 
        ? Math.min(...roomData.guesses.map(g => g.rank))
        : 0;

      // Update prev status ref
      prevRoomStatusRef.current = roomData.room?.status || null;

      // Atualizar cache de players (evita N+1 queries no realtime)
      const playersMap = new Map<string, string>();
      (roomData.players || []).forEach(player => {
        playersMap.set(player.user_id, player.nickname);
      });
      playersMapRef.current = playersMap;

      setState({
        room: roomData.room,
        players: roomData.players || [],
        guesses: roomData.guesses || [],
        bestRank,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching room:", err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Erro ao carregar sala",
      }));
    }
  }, [roomId]);

  // Setup Realtime subscription
  useEffect(() => {
    if (!roomId || !userId) return;

    const supabase = getSupabase();

    const setupRealtimeSubscription = async () => {
      // Initial fetch
      await fetchRoomDetails();

      // Clean up previous channel if exists
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      // Create channel with unique name
      const channel = supabase.channel(`room-${roomId}-${Date.now()}`);

      // Listen to new guesses
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guesses",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newGuess = payload.new as GuessWithPlayer;

          // Usar cache de players em vez de fazer query (evita N+1)
          const nickname = playersMapRef.current.get(newGuess.user_id) || "Jogador";

          const guessWithNickname: GuessWithPlayer = {
            ...newGuess,
            nickname,
          };

          setState(prev => {
            // Check if guess already exists (avoid duplicates)
            if (prev.guesses.some(g => g.id === newGuess.id)) {
              return prev;
            }

            const newGuesses = [...prev.guesses, guessWithNickname];
            const currentBestRank = prev.bestRank || Infinity;
            const newBestRank = Math.min(currentBestRank, newGuess.rank);
            
            return {
              ...prev,
              guesses: newGuesses,
              bestRank: newBestRank === Infinity ? newGuess.rank : newBestRank,
            };
          });

          // Show toast for other players' guesses
          if (newGuess.user_id !== userId) {
            if (newGuess.rank === 1 || newGuess.rank === 0) {
              toast.success(`${guessWithNickname.nickname} venceu!`);
              // Fetch room details to get winner info
              setTimeout(() => fetchRoomDetails(), 500);
            } else if (newGuess.rank <= 10) {
              toast.info(`${guessWithNickname.nickname} está muito quente! (#${newGuess.rank})`);
            }
          }
        }
      );

      // Listen to guess updates (reveals)
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "guesses",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedGuess = payload.new as GuessWithPlayer;
          
          setState(prev => ({
            ...prev,
            guesses: prev.guesses.map(g => 
              g.id === updatedGuess.id 
                ? { ...g, is_revealed: updatedGuess.is_revealed } 
                : g
            ),
          }));

          // Show collision toast only once (when it becomes revealed)
          if (updatedGuess.is_revealed && payload.old && !(payload.old as GuessWithPlayer).is_revealed) {
            toast.info(`Colisão na palavra "${updatedGuess.word}"!`);
          }
        }
      );

      // Listen to room updates
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const updatedRoom = payload.new as Room;
          const previousStatus = prevRoomStatusRef.current;
          
          // Update the ref before setState
          prevRoomStatusRef.current = updatedRoom.status;
          
          setState(prev => ({
            ...prev,
            room: { ...prev.room, ...updatedRoom } as Room,
          }));

          // Check for game start
          if (previousStatus === "waiting" && updatedRoom.status === "playing") {
            toast.success("O jogo começou!");
          }

          // Check for game end - use our ref instead of payload.old
          if (updatedRoom.status === "finished" && previousStatus !== "finished") {
            // Fetch final room details to get winner info and secret word
            setTimeout(() => fetchRoomDetails(), 300);
          }
        }
      );

      // Listen to new players
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newPlayer = payload.new as RoomPlayer;

          // Atualizar cache de players (para futuros palpites deste player)
          playersMapRef.current.set(newPlayer.user_id, newPlayer.nickname);

          setState(prev => {
            // Check if player already exists (avoid duplicates)
            if (prev.players.some(p => p.user_id === newPlayer.user_id)) {
              return prev;
            }

            return {
              ...prev,
              players: [...prev.players, newPlayer],
            };
          });

          if (newPlayer.user_id !== userId) {
            toast.info(`${newPlayer.nickname} entrou na sala`);
          }
        }
      );

      // Subscribe to the channel
      channel.subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("[Realtime] Channel error for room:", roomId);
          toast.error("Erro na conexão em tempo real. Atualize a página.");
        }
      });

      channelRef.current = channel;
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, userId, fetchRoomDetails]);

  const submitGuess = useCallback(async (word: string): Promise<SubmitGuessResponse | null> => {
    try {
      const response = await fetch("/api/guess/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          userId,
          word: word.toLowerCase().trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao enviar palpite");
        return null;
      }

      const data: SubmitGuessResponse = await response.json();

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      if (data.is_winner) {
        toast.success("🏆 Você venceu! Parabéns!");
        // Immediately fetch room details to show dashboard
        setTimeout(() => fetchRoomDetails(), 500);
      } else if (data.revealed) {
        toast.info("⚔️ Colisão! A palavra foi revelada para todos.");
      }

      return data;

    } catch (err) {
      console.error("Error submitting guess:", err);
      toast.error("Erro ao enviar palpite");
      return null;
    }
  }, [roomId, userId, fetchRoomDetails]);

  // Start the game
  const startGame = useCallback(async (): Promise<boolean> => {
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase.rpc("start_game", {
        p_room_id: roomId,
        p_user_id: userId,
      });

      if (error) throw error;

      const response = data as StartGameResponse;
      
      if (response.error) {
        toast.error(response.error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error starting game:", err);
      toast.error("Erro ao iniciar jogo");
      return false;
    }
  }, [roomId, userId]);

  return {
    ...state,
    submitGuess,
    startGame,
    refresh: fetchRoomDetails,
  };
}
