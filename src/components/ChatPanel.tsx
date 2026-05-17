import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { getSocket } from "@/lib/socket";

export function ChatPanel({ disabled }: { disabled: boolean }) {
  const messages = useGameStore((s) => s.messages);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim().slice(0, 120);
    if (!trimmed) return;
    getSocket().emit("guess", { text: trimmed });
    setText("");
  }

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/50 text-sm font-semibold">
        Chat & Guesses
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1 text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`px-2 py-1 rounded-md leading-snug ${
              m.type === "system"
                ? "text-muted-foreground italic"
                : m.type === "correct"
                  ? "bg-success/15 text-success font-medium"
                  : m.type === "close"
                    ? "bg-warning/15 text-warning"
                    : "text-foreground"
            }`}
          >
            {m.type !== "system" && (
              <span className="font-semibold mr-1" style={{ color: m.color }}>
                {m.playerName}:
              </span>
            )}
            <span>{m.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 p-2 border-t border-border/50">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          disabled={disabled}
          placeholder={disabled ? "You're drawing…" : "Type your guess…"}
          className="flex-1 bg-input/50 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="h-9 w-9 grid place-items-center rounded-md gradient-bg-primary text-white disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
