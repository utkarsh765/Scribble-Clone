// Shared types between server and client.
// Mirror of client/src/types/game.ts — keep both in sync.

export type GamePhase = "lobby" | "choosing" | "drawing" | "round_end" | "game_over";

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  hintCount: number;
  isPrivate: boolean;
}

export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isDrawer: boolean;
  hasGuessed: boolean;
  avatarColor: string;
}

export interface PublicRoomState {
  code: string;
  hostId: string;
  players: PublicPlayer[];
  settings: RoomSettings;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  drawerId: string | null;
  wordMask: string;
  wordLength: number;
  fullWord?: string;
  timeLeft: number;
  winners?: PublicPlayer[];
}

export interface WordOption {
  word: string;
  category: string;
}
