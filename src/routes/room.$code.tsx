import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, LogOut, Play } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { useGameStore } from "@/store/gameStore";
import { useGameSocket } from "@/hooks/useGameSocket";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { CanvasBoard } from "@/components/CanvasBoard";
import { BrushControls } from "@/components/BrushControls";
import { ChatPanel } from "@/components/ChatPanel";
import { PlayerList } from "@/components/PlayerList";
import { Timer } from "@/components/Timer";
import { WordHint } from "@/components/WordHint";
import { WordChoiceModal } from "@/components/WordChoiceModal";
import { GameOverModal } from "@/components/GameOverModal";
import type { RoomState } from "@/types/game";

export const Route = createFileRoute("/room/$code")({
  head: () => ({ meta: [{ title: "Game room — Scribble Clone" }] }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { room, playerName, setRoom, wordOptions, reset } = useGameStore();
  useGameSocket();

  // If the user lands here via direct URL (no room loaded), try to rejoin.
  useEffect(() => {
    if (!playerName) {
      navigate({ to: "/join" });
      return;
    }
    if (!room) {
      const s = connectSocket();
      s.emit(
        "join_room",
        { code, name: playerName },
        (res: { ok: boolean; room?: RoomState; error?: string }) => {
          if (!res.ok || !res.room) {
            toast.error(res.error ?? "Could not join room");
            navigate({ to: "/" });
            return;
          }
          setRoom(res.room);
        },
      );
    }
    return () => {
      // disconnect when leaving the room route
    };
  }, [code, playerName]);

  const me = useMemo(() => room?.players.find((p) => p.id === getSocket().id), [room]);
  const isHost = !!me?.isHost;
  const isDrawer = !!me && me.id === room?.drawerId;

  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(8);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");

  function leave() {
    disconnectSocket();
    reset();
    navigate({ to: "/" });
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    toast.success("Room code copied");
  }

  if (!room) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Connecting to room…
      </div>
    );
  }

  const inLobby = room.phase === "lobby";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-7xl w-full px-3 sm:px-6 py-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Room</div>
            <button
              onClick={copyCode}
              className="font-mono font-bold tracking-[0.3em] text-lg px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/70 flex items-center gap-2"
            >
              {room.code}
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Round {Math.min(room.round, room.totalRounds)} / {room.totalRounds}
            </span>
          </div>
          <button
            onClick={leave}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-destructive/20 hover:text-destructive flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" /> Leave
          </button>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr_300px] gap-4">
          <PlayerList players={room.players} drawerId={room.drawerId} />

          <div className="space-y-3">
            {inLobby ? (
              <Lobby room={room} isHost={isHost} />
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 px-2">
                  <Timer seconds={room.timeLeft} />
                  <WordHint
                    mask={room.wordMask}
                    fullWord={room.fullWord}
                    isDrawer={isDrawer}
                    length={room.wordLength}
                  />
                  <div className="w-12" />
                </div>
                <CanvasBoard canDraw={isDrawer} color={color} size={size} tool={tool} />
                {isDrawer && (
                  <BrushControls
                    color={color}
                    setColor={setColor}
                    size={size}
                    setSize={setSize}
                    tool={tool}
                    setTool={setTool}
                    disabled={false}
                  />
                )}
              </>
            )}
          </div>

          <div className="h-[460px] lg:h-auto">
            <ChatPanel disabled={isDrawer} />
          </div>
        </div>
      </main>

      {isDrawer && wordOptions && <WordChoiceModal options={wordOptions} />}
      {room.phase === "game_over" && <GameOverModal players={room.players} />}
    </div>
  );
}

function Lobby({ room, isHost }: { room: RoomState; isHost: boolean }) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center space-y-4 min-h-[460px] grid place-items-center">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Lobby</h2>
        <p className="text-muted-foreground mt-1">
          Share the code <span className="font-mono font-bold">{room.code}</span> with friends.
        </p>
        <div className="text-xs text-muted-foreground mt-4">
          {room.settings.rounds} rounds · {room.settings.drawTime}s draw time · max{" "}
          {room.settings.maxPlayers}
        </div>
        {isHost ? (
          <button
            disabled={room.players.length < 2}
            onClick={() => getSocket().emit("start_game")}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-bg-primary text-white font-semibold shadow-glow disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {room.players.length < 2 ? "Waiting for players…" : "Start game"}
          </button>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Waiting for host to start…</p>
        )}
      </div>
    </div>
  );
}
