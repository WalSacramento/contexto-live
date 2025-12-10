// Game Modes
export type GameMode = "classic" | "contexto";

// Database Types
export interface Dictionary {
  id: number;
  word: string;
  embedding: number[];
}

export interface Room {
  id: string;
  secret_word_id: number | null;
  status: "waiting" | "playing" | "finished";
  created_at: string;
  winner_id?: string | null;
  secret_word?: string | null; // Only available when game is finished (classic mode)
  game_mode: GameMode;
  game_day?: number | null; // Only used in contexto mode
}

export interface RoomPlayer {
  room_id: string;
  user_id: string;
  nickname: string;
  is_host: boolean;
  joined_at: string;
}

export interface Guess {
  id: string;
  room_id: string;
  user_id: string;
  word: string;
  rank: number;
  is_revealed: boolean;
  created_at: string;
}

// Extended types for UI
export interface GuessWithPlayer extends Guess {
  nickname?: string;
}

// RPC Response Types
export interface SubmitGuessResponse {
  success?: boolean;
  error?: string;
  rank?: number;
  revealed?: boolean;
  is_winner?: boolean;
}

export interface CreateRoomResponse {
  success?: boolean;
  error?: string;
  room_id?: string;
}

export interface JoinRoomResponse {
  success?: boolean;
  error?: string;
  room_status?: string;
}

export interface StartGameResponse {
  success?: boolean;
  error?: string;
  game_mode?: GameMode;
}

// Player Context
export interface Player {
  id: string;
  nickname: string;
}

// Contexto.me API Response
export interface ContextoAPIResponse {
  distance?: number;
  lemma?: string;
  word?: string;
  error?: string;
}
