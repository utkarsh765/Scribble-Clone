// Shared types between client and server. Keep in sync with server/src/types/index.ts.

export type GamePhase = "lobby" | "choosing" | "drawing" | "round_end" | "game_over";

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isDrawer: boolean;
  hasGuessed: boolean;
  avatarColor: string;
}

export interface RoomSettings {
  maxPlayers: number;     // 2-20
  rounds: number;         // 2-10
  drawTime: number;       // 15-240 seconds
  hintCount: number;
  isPrivate: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  drawerId: string | null;
  // Public word view (e.g. "_ a _ _ _") for guessers; full word for drawer.
  wordMask: string;
  wordLength: number;
  fullWord?: string;       // only sent to the current drawer
  timeLeft: number;
  winners?: Player[];      // populated on game_over
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: "chat" | "system" | "correct" | "close";
  color?: string;
}

// Drawing events — kept tiny for low-latency broadcast.
export interface DrawStart {
  x: number;
  y: number;
  color: string;
  size: number;
  tool: "brush" | "eraser";
  strokeId: string;
}
export interface DrawMove {
  x: number;
  y: number;
  strokeId: string;
}
export interface DrawEnd {
  strokeId: string;
}

// Full stroke for replay when a new player joins / undo state.
export interface Stroke {
  id: string;
  color: string;
  size: number;
  tool: "brush" | "eraser";
  points: { x: number; y: number }[];
}

export interface WordOption {
  word: string;
  category: string;
}
