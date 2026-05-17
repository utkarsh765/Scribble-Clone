import { Trophy } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Player } from "@/types/game";

export function GameOverModal({ players }: { players: Player[] }) {
  const navigate = useNavigate();
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 5);
  const winner = sorted[0];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center shadow-glow">
        <div className="mx-auto h-16 w-16 rounded-full gradient-bg-primary grid place-items-center shadow-glow">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mt-4">Game Over!</h2>
        {winner && (
          <p className="text-muted-foreground mt-1">
            <span className="gradient-text font-bold">{winner.name}</span> wins with {winner.score} pts
          </p>
        )}
        <ol className="mt-6 space-y-2 text-left">
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/40"
            >
              <span className="font-bold text-lg w-6 text-center">{i + 1}</span>
              <div
                className="h-8 w-8 rounded-full grid place-items-center text-sm font-bold text-white"
                style={{ background: p.avatarColor }}
              >
                {p.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="flex-1 font-medium truncate">{p.name}</span>
              <span className="font-bold text-primary">{p.score}</span>
            </li>
          ))}
        </ol>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-6 w-full py-2.5 rounded-lg gradient-bg-primary text-white font-semibold shadow-glow hover:opacity-90"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
