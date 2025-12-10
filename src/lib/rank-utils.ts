/**
 * Utility functions for rank calculations and display
 */

export type RankTier = "winner" | "hot" | "warm" | "cold";

export function getRankTier(rank: number): RankTier {
  if (rank === 1) return "winner";
  if (rank <= 100) return "hot";
  if (rank <= 1000) return "warm";
  return "cold";
}

export function getRankColor(rank: number): string {
  const tier = getRankTier(rank);
  switch (tier) {
    case "winner":
      return "rank-winner";
    case "hot":
      return "rank-hot";
    case "warm":
      return "rank-warm";
    case "cold":
      return "rank-cold";
  }
}

export function getRankEmoji(rank: number): string {
  const tier = getRankTier(rank);
  switch (tier) {
    case "winner":
      return "🏆";
    case "hot":
      return "🔥";
    case "warm":
      return "🟨";
    case "cold":
      return "🟥";
  }
}

export function maskWord(word: string): string {
  return "*".repeat(word.length);
}

export function formatRank(rank: number): string {
  return `#${rank.toLocaleString("pt-BR")}`;
}

