import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { getSocket } from "@/lib/socket";
import type { Stroke } from "@/types/game";

interface Props {
  canDraw: boolean;
  color: string;
  size: number;
  tool: "brush" | "eraser";
}

// Logical canvas size — broadcast coordinates are normalised to this.
const W = 800;
const H = 500;

export function CanvasBoard({ canDraw, color, size, tool }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const strokeIdRef = useRef<string | null>(null);
  const lastEmitRef = useRef<number>(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const strokes = useGameStore((s) => s.strokes);

  // Redraw the entire canvas from the strokes array.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) drawStroke(ctx, stroke);
  }, [strokes]);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length === 0) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.beginPath();
    const [first, ...rest] = stroke.points;
    ctx.moveTo(first.x, first.y);
    for (const p of rest) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = getPos(e);
    lastPointRef.current = p;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    const id = Date.now().toString();
    strokeIdRef.current = id;
    getSocket().emit("draw_start", {
      x: p.x,
      y: p.y,
      color,
      size,
      tool,
      strokeId: id,
    });
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !strokeIdRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const p = getPos(e);

    if (!lastPointRef.current) {
      lastPointRef.current = p;
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    lastPointRef.current = p;

    const now = performance.now();

    if (now - lastEmitRef.current < 16) return;

    lastEmitRef.current = now;

    getSocket().emit("draw_move", {
      x: p.x,
      y: p.y,
      strokeId: strokeIdRef.current,
    });
  }

  function onPointerUp() {
    if (!drawingRef.current) return;

    drawingRef.current = false;
    lastPointRef.current = null;
    if (strokeIdRef.current) {
      getSocket().emit("draw_end", {
        strokeId: strokeIdRef.current,
      });

      strokeIdRef.current = null;
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden bg-white shadow-card border border-border"
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block w-full h-auto touch-none"
        style={{ cursor: canDraw ? "crosshair" : "not-allowed" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
