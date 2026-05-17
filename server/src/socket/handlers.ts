// Socket.IO event handlers. Thin layer: validate input, route to GameManager/Room.
import type { Server, Socket } from "socket.io";
import type { GameManager } from "../classes/GameManager";
import type { RoomSettings } from "../types";

const NAME_MAX = 16;
const CODE_MAX = 6;
const CHAT_MAX = 120;

function sanitize(text: string, max: number) {
  return String(text ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

function validSettings(s: any): RoomSettings {
  return {
    maxPlayers: clamp(+s?.maxPlayers || 8, 2, 20),
    rounds: clamp(+s?.rounds || 3, 2, 10),
    drawTime: clamp(+s?.drawTime || 80, 15, 240),
    hintCount: clamp(+s?.hintCount || 2, 0, 5),
    isPrivate: !!s?.isPrivate,
  };
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function registerSocketHandlers(io: Server, gm: GameManager) {
  // very simple per-socket rate limiter for chat/guess events
  const lastChatAt = new Map<string, number>();

  io.on("connection", (socket: Socket) => {
    socket.on("create_room", (payload, cb) => {
      try {
        const name = sanitize(payload?.name, NAME_MAX);
        if (name.length < 2) return cb?.({ ok: false, error: "Invalid name" });
        const settings = validSettings(payload?.settings);
        const room = gm.createRoom(socket.id, settings);
        const player = room.addPlayer(socket, name);
        if (!player) return cb?.({ ok: false, error: "Could not join" });
        cb?.({ ok: true, room: room.toPublic() });
      } catch (e) {
        cb?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("join_room", (payload, cb) => {
      try {
        const name = sanitize(payload?.name, NAME_MAX);
        const code = sanitize(payload?.code, CODE_MAX).toUpperCase();
        if (name.length < 2) return cb?.({ ok: false, error: "Invalid name" });
        const room = gm.getRoom(code);
        if (!room) return cb?.({ ok: false, error: "Room not found" });
        if (room.players.size >= room.settings.maxPlayers)
          return cb?.({ ok: false, error: "Room is full" });
        const player = room.addPlayer(socket, name);
        if (!player) return cb?.({ ok: false, error: "Could not join" });
        cb?.({ ok: true, room: room.toPublic() });
      } catch {
        cb?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("start_game", () => {
      const room = gm.findRoomBySocket(socket.id);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (!player?.isHost) return socket.emit("error_message", "Only the host can start");
      if (room.players.size < 2)
        return socket.emit("error_message", "Need at least 2 players");
      room.startGame();
    });

    socket.on("word_chosen", (word: string) => {
      const room = gm.findRoomBySocket(socket.id);
      if (!room) return;
      if (room.drawerId !== socket.id) return;
      room.chooseWord(sanitize(word, 40));
    });

    // --- chat / guess ---
    socket.on("guess", (payload) => {
      const now = Date.now();
      const last = lastChatAt.get(socket.id) ?? 0;
      if (now - last < 250) return; // basic anti-spam
      lastChatAt.set(socket.id, now);

      const room = gm.findRoomBySocket(socket.id);
      if (!room) return;
      const text = sanitize(payload?.text, CHAT_MAX);
      if (!text) return;
      room.handleGuess(socket.id, text);
    });

    // --- drawing relay ---
    socket.on("draw_start", (p) => {
      const room = gm.findRoomBySocket(socket.id);
      room?.relayDrawStart(socket.id, p);
    });
    socket.on("draw_move", (p) => {
      const room = gm.findRoomBySocket(socket.id);
      room?.relayDrawMove(socket.id, p);
    });
    socket.on("draw_end", (p) => {
      const room = gm.findRoomBySocket(socket.id);
      room?.relayDrawEnd(socket.id, p);
    });
    socket.on("canvas_clear", () => {
      const room = gm.findRoomBySocket(socket.id);
      room?.clearCanvas(socket.id);
    });
    socket.on("draw_undo", () => {
      const room = gm.findRoomBySocket(socket.id);
      room?.undoStroke(socket.id);
    });

    socket.on("disconnect", () => {
      lastChatAt.delete(socket.id);
      const room = gm.findRoomBySocket(socket.id);
      room?.removePlayer(socket.id);
    });
  });
}
