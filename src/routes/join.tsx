import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useGameStore } from "@/store/gameStore";
import { connectSocket } from "@/lib/socket";
import type { RoomState } from "@/types/game";
import { toast } from "sonner";

export const Route = createFileRoute("/join")({
  head: () => ({ meta: [{ title: "Join a room — Scribble Clone" }] }),
  component: JoinPage,
});

function JoinPage() {
  const navigate = useNavigate();
  const { playerName, setPlayerName, setRoom } = useGameStore();
  const [name, setName] = useState(playerName);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim().slice(0, 16);
    const cleanCode = code.trim().toUpperCase().slice(0, 6);
    if (trimmed.length < 2) return toast.error("Name must be at least 2 characters");
    if (cleanCode.length < 4) return toast.error("Enter a valid room code");
    setPlayerName(trimmed);
    setLoading(true);
    const s = connectSocket();
    s.emit(
      "join_room",
      { code: cleanCode, name: trimmed },
      (res: { ok: boolean; room?: RoomState; error?: string }) => {
        setLoading(false);
        if (!res.ok || !res.room) return toast.error(res.error ?? "Failed to join");
        setRoom(res.room);
        navigate({ to: "/room/$code", params: { code: res.room.code } });
      },
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 grid place-items-center px-4 py-10">
        <form onSubmit={submit} className="glass-panel rounded-2xl p-6 max-w-md w-full space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Join a room</h1>
            <p className="text-sm text-muted-foreground">Enter the code your friend shared.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Your name</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} maxLength={16} required
              className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Picasso"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Room code</label>
            <input
              value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} required
              className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-center font-mono text-2xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="ABCD12"
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-2.5 rounded-lg gradient-bg-primary text-white font-semibold shadow-glow disabled:opacity-50"
          >
            {loading ? "Joining…" : "Join room"}
          </button>
        </form>
      </main>
    </div>
  );
}
