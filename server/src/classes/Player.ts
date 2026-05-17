// Player class: holds per-socket data inside a room.
// Pure value object — no Socket.IO knowledge.
import type { PublicPlayer } from "../types";

const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#a855f7", "#0ea5e9",
];

export class Player {
  id: string;
  name: string;
  score = 0;
  isHost = false;
  isDrawer = false;
  hasGuessed = false;
  avatarColor: string;

  constructor(id: string, name: string, isHost = false) {
    this.id = id;
    this.name = name;
    this.isHost = isHost;
    // pick a stable color from the socket id
    const idx =
      [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
    this.avatarColor = AVATAR_COLORS[idx];
  }

  toPublic(): PublicPlayer {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isHost: this.isHost,
      isDrawer: this.isDrawer,
      hasGuessed: this.hasGuessed,
      avatarColor: this.avatarColor,
    };
  }
}
