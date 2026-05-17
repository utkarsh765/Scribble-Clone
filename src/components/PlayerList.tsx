import { Crown, Pencil, Check } from "lucide-react";
import type { Player } from "@/types/game";

export function PlayerList({ players, drawerId }: { players: Player[]; drawerId: string | null }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/50 text-sm font-semibold">
        Players ({players.length})
      </div>
      <ul className="divide-y divide-border/40">
        {sorted.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 px-3 py-2 ${
              p.id === drawerId ? "bg-primary/10" : ""
            }`}
          >
            <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
            <div
              className="h-8 w-8 rounded-full grid place-items-center text-sm font-bold text-white shrink-0"
              style={{ background: p.avatarColor }}
            >
              {p.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-sm font-medium truncate">
                {p.name}
                {p.isHost && <Crown className="h-3.5 w-3.5 text-warning shrink-0" />}
                {p.id === drawerId && <Pencil className="h-3.5 w-3.5 text-primary shrink-0" />}
                {p.hasGuessed && <Check className="h-3.5 w-3.5 text-success shrink-0" />}
              </div>
              <div className="text-xs text-muted-foreground">{p.score} pts</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
