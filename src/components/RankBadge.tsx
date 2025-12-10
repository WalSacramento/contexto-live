"use client";

import { cn } from "@/lib/utils";
import { getRankColor, getRankEmoji, formatRank } from "@/lib/rank-utils";

interface RankBadgeProps {
  rank: number;
  showEmoji?: boolean;
  className?: string;
}

export function RankBadge({ rank, showEmoji = true, className }: RankBadgeProps) {
  const colorClass = getRankColor(rank);
  const emoji = getRankEmoji(rank);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-sm font-semibold",
        colorClass,
        className
      )}
    >
      {showEmoji && <span>{emoji}</span>}
      <span>{formatRank(rank)}</span>
    </span>
  );
}

