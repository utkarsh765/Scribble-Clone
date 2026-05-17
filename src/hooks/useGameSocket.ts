import { useEffect } from "react";
import { connectSocket, getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/gameStore";
import type {
  ChatMessage,
  DrawEnd,
  DrawMove,
  DrawStart,
  RoomState,
  Stroke,
  WordOption,
} from "@/types/game";
import { toast } from "sonner";

/**
 * Subscribes the Zustand store to all server-pushed events.
 * Mount this once at the room route level.
 */
export function useGameSocket() {
  const {
    setRoom,
    patchRoom,
    addMessage,
    addStroke,
    appendPoint,
    setStrokes,
    clearStrokes,
    undoStroke,
    setWordOptions,
  } = useGameStore.getState();

  useEffect(() => {
    const s = connectSocket();

    const onRoomState = (room: RoomState) => setRoom(room);
    const onPatch = (patch: Partial<RoomState>) => patchRoom(patch);
    const onPlayerJoined = (room: RoomState) => setRoom(room);
    const onPlayerLeft = (room: RoomState) => setRoom(room);

    const onChat = (m: ChatMessage) => addMessage(m);
    const onSystem = (text: string) =>
      addMessage({
        id: crypto.randomUUID(),
        playerId: "system",
        playerName: "System",
        text,
        type: "system",
      });

    const onWordOptions = (opts: WordOption[]) => setWordOptions(opts);
    const onWordChosen = () => setWordOptions(null);

    const onRoundStart = (room: RoomState) => {
      clearStrokes();
      setRoom(room);
    };
    const onRoundEnd = (payload: { word: string; room: RoomState }) => {
      setRoom(payload.room);
      addMessage({
        id: crypto.randomUUID(),
        playerId: "system",
        playerName: "System",
        text: `The word was: ${payload.word}`,
        type: "system",
      });
    };
    const onGameOver = (room: RoomState) => setRoom(room);

    const onDrawStart = (d: DrawStart) =>
      addStroke({
        id: d.strokeId,
        color: d.color,
        size: d.size,
        tool: d.tool,
        points: [{ x: d.x, y: d.y }],
      });
    const onDrawMove = (d: DrawMove) => appendPoint(d.strokeId, { x: d.x, y: d.y });
    const onDrawEnd = (_d: DrawEnd) => {};
    const onCanvasClear = () => clearStrokes();
    const onDrawUndo = () => undoStroke();
    const onCanvasState = (strokes: Stroke[]) => setStrokes(strokes);

    const onErrorMsg = (msg: string) => toast.error(msg);

    s.on("room_state", onRoomState);
    s.on("room_patch", onPatch);
    s.on("player_joined", onPlayerJoined);
    s.on("player_left", onPlayerLeft);
    s.on("chat_message", onChat);
    s.on("system_message", onSystem);
    s.on("word_options", onWordOptions);
    s.on("word_chosen", onWordChosen);
    s.on("round_start", onRoundStart);
    s.on("round_end", onRoundEnd);
    s.on("game_over", onGameOver);
    s.on("draw_start", onDrawStart);
    s.on("draw_move", onDrawMove);
    s.on("draw_end", onDrawEnd);
    s.on("canvas_clear", onCanvasClear);
    s.on("draw_undo", onDrawUndo);
    s.on("canvas_state", onCanvasState);
    s.on("error_message", onErrorMsg);

    return () => {
      s.off("room_state", onRoomState);
      s.off("room_patch", onPatch);
      s.off("player_joined", onPlayerJoined);
      s.off("player_left", onPlayerLeft);
      s.off("chat_message", onChat);
      s.off("system_message", onSystem);
      s.off("word_options", onWordOptions);
      s.off("word_chosen", onWordChosen);
      s.off("round_start", onRoundStart);
      s.off("round_end", onRoundEnd);
      s.off("game_over", onGameOver);
      s.off("draw_start", onDrawStart);
      s.off("draw_move", onDrawMove);
      s.off("draw_end", onDrawEnd);
      s.off("canvas_clear", onCanvasClear);
      s.off("draw_undo", onDrawUndo);
      s.off("canvas_state", onCanvasState);
      s.off("error_message", onErrorMsg);
    };
  }, []);

  return getSocket();
}
