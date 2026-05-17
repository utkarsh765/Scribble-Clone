import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useGameStore } from "@/store/gameStore";
import { connectSocket, getSocket } from "@/lib/socket";
import type { RoomState } from "@/types/game";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Create a room — Scribble Clone" }] }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const { playerName, setPlayerName, setRoom } = useGameStore();
  const [name, setName] = useState(playerName);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim().slice(0, 16);
    if (trimmed.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    setPlayerName(trimmed);
    setLoading(true);
    const s = connectSocket();
    s.emit(
      "create_room",
      {
        name: trimmed,
        settings: { maxPlayers, rounds, drawTime, hintCount: 2, isPrivate },
      },
      (res: { ok: boolean; room?: RoomState; error?: string }) => {
        setLoading(false);
        if (!res.ok || !res.room) {
          toast.error(res.error ?? "Failed to create room");
          return;
        }
        setRoom(res.room);
        navigate({ to: "/room/$code", params: { code: res.room.code } });
      },
    );
    // safety timeout
    setTimeout(() => {
      if (!getSocket().connected) {
        setLoading(false);
        toast.error("Cannot reach server. Check VITE_SOCKET_URL.");
      }
    }, 5000);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 grid place-items-center px-4 py-10">
        <form onSubmit={submit} className="glass-panel rounded-2xl p-6 max-w-md w-full space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Create a room</h1>
            <p className="text-sm text-muted-foreground">Customise your game and invite friends.</p>
          </div>

          <Field label="Your name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              required
              className="input-base"
              placeholder="Picasso"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Max players: ${maxPlayers}`}>
              <input
                type="range" min={2} max={20}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(+e.target.value)}
                className="w-full accent-primary"
              />
            </Field>
            <Field label={`Rounds: ${rounds}`}>
              <input
                type="range" min={2} max={10}
                value={rounds}
                onChange={(e) => setRounds(+e.target.value)}
                className="w-full accent-primary"
              />
            </Field>
          </div>

          <Field label={`Draw time: ${drawTime}s`}>
            <input
              type="range" min={15} max={240} step={5}
              value={drawTime}
              onChange={(e) => setDrawTime(+e.target.value)}
              className="w-full accent-primary"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-primary h-4 w-4"
            />
            Private room (not listed publicly)
          </label>

          <button
            disabled={loading}
            className="w-full py-2.5 rounded-lg gradient-bg-primary text-white font-semibold shadow-glow disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create room"}
          </button>
        </form>
      </main>
      <style>{`.input-base{width:100%;background:color-mix(in oklab,var(--input) 60%,transparent);border:1px solid var(--border);border-radius:.5rem;padding:.55rem .75rem;font-size:.9rem;outline:none}.input-base:focus{box-shadow:0 0 0 2px color-mix(in oklab,var(--ring) 60%,transparent)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
