"use client";

import { ContextoAPIResponse } from "@/lib/types";

interface FetchRankResult {
  success: boolean;
  rank?: number;
  error?: string;
}

/**
 * Fetch rank from Contexto.me API via our proxy
 * @param gameDay - The game day (1-1386)
 * @param word - The word to check
 * @returns Object with rank or error
 */
export async function fetchContextoRank(
  gameDay: number,
  word: string
): Promise<FetchRankResult> {
  try {
    // Normalize word
    const normalizedWord = word.toLowerCase().trim();
    
    // Use our API proxy to avoid CORS issues
    const url = `/api/contexto/${gameDay}/${encodeURIComponent(normalizedWord)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        success: false,
        error: "Erro de conexão. Tente novamente.",
      };
    }

    const data: ContextoAPIResponse = await response.json();

    // Check for error in response
    if (data.error) {
      return {
        success: false,
        error: data.error, // "Essa palavra não vale"
      };
    }

    // Success - distance is the rank
    // Note: In Contexto.me, distance 0 = correct word
    // We add 1 to make it consistent (1 = winner)
    const rank = (data.distance ?? 0) + 1;

    return {
      success: true,
      rank,
    };
  } catch (error) {
    console.error("Error fetching from Contexto API:", error);
    return {
      success: false,
      error: "Erro de conexão. Tente novamente.",
    };
  }
}

/**
 * Hook for Contexto.me API interactions
 */
export function useContextoAPI() {
  return {
    fetchRank: fetchContextoRank,
  };
}
