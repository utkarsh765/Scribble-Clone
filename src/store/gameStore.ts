import { create } from "zustand";
import type { ChatMessage, RoomState, Stroke, WordOption } from "@/types/game";

interface GameStore {
  playerName: string;
  setPlayerName: (n: string) => void;

  room: RoomState | null;
  setRoom: (r: RoomState | null) => void;
  patchRoom: (p: Partial<RoomState>) => void;

  messages: ChatMessage[];
  addMessage: (m: ChatMessage) => void;
  clearMessages: () => void;

  strokes: Stroke[];
  addStroke: (s: Stroke) => void;
  appendPoint: (id: string, p: { x: number; y: number }) => void;
  setStrokes: (s: Stroke[]) => void;
  clearStrokes: () => void;
  undoStroke: () => void;

  wordOptions: WordOption[] | null;
  setWordOptions: (o: WordOption[] | null) => void;

  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  playerName:
    typeof window !== "undefined" ? localStorage.getItem("playerName") ?? "" : "",
  setPlayerName: (n) => {
    if (typeof window !== "undefined") localStorage.setItem("playerName", n);
    set({ playerName: n });
  },

  room: null,
  setRoom: (r) => set({ room: r }),
  patchRoom: (p) =>
    set((s) => (s.room ? { room: { ...s.room, ...p } } : { room: s.room })),

  messages: [],
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m].slice(-200) })),
  clearMessages: () => set({ messages: [] }),

  strokes: [],
  addStroke: (st) => set((s) => ({ strokes: [...s.strokes, st] })),
  appendPoint: (id, p) =>
    set((s) => ({
      strokes: s.strokes.map((st) =>
        st.id === id ? { ...st, points: [...st.points, p] } : st,
      ),
    })),
  setStrokes: (s) => set({ strokes: s }),
  clearStrokes: () => set({ strokes: [] }),
  undoStroke: () => set((s) => ({ strokes: s.strokes.slice(0, -1) })),

  wordOptions: null,
  setWordOptions: (o) => set({ wordOptions: o }),

  reset: () =>
    set({
      room: null,
      messages: [],
      strokes: [],
      wordOptions: null,
    }),
}));
