import { getSocket } from "@/lib/socket";
import type { WordOption } from "@/types/game";

export function WordChoiceModal({ options }: { options: WordOption[] }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl p-6 max-w-md w-full text-center shadow-glow">
        <h2 className="text-xl font-bold mb-1">Choose a word to draw</h2>
        <p className="text-sm text-muted-foreground mb-5">Pick wisely — the timer starts after you choose.</p>
        <div className="grid gap-2">
          {options.map((o) => (
            <button
              key={o.word}
              onClick={() => getSocket().emit("word_chosen", o.word)}
              className="px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-colors text-left"
            >
              <span className="font-semibold">{o.word}</span>
              <span className="ml-2 text-xs text-muted-foreground">{o.category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
