import { Eraser, Trash2, Undo2 } from "lucide-react";
import { getSocket } from "@/lib/socket";

const COLORS = [
  "#000000", "#7f7f7f", "#c1c1c1", "#ffffff",
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#7c2d12", "#a16207", "#1e3a8a", "#831843",
];

interface Props {
  color: string;
  setColor: (c: string) => void;
  size: number;
  setSize: (s: number) => void;
  tool: "brush" | "eraser";
  setTool: (t: "brush" | "eraser") => void;
  disabled: boolean;
}

export function BrushControls({
  color,
  setColor,
  size,
  setSize,
  tool,
  setTool,
  disabled,
}: Props) {
  return (
    <div
      className={`flex flex-wrap gap-3 items-center p-3 rounded-xl glass-panel ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="grid grid-cols-8 gap-1">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setTool("brush");
            }}
            className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${
              color === c && tool === "brush"
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "border-border"
            }`}
            style={{ background: c }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        {[4, 8, 14, 22].map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`grid place-items-center h-8 w-8 rounded-md border ${
              size === s ? "border-primary bg-secondary" : "border-border"
            }`}
            aria-label={`Brush size ${s}`}
          >
            <span
              className="rounded-full bg-foreground"
              style={{ width: s / 1.5, height: s / 1.5 }}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => setTool(tool === "eraser" ? "brush" : "eraser")}
          className={`h-9 w-9 grid place-items-center rounded-md border ${
            tool === "eraser" ? "border-primary bg-secondary" : "border-border"
          }`}
          title="Eraser"
        >
          <Eraser className="h-4 w-4" />
        </button>
        <button
          onClick={() => getSocket().emit("draw_undo")}
          className="h-9 w-9 grid place-items-center rounded-md border border-border hover:bg-secondary"
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => getSocket().emit("canvas_clear")}
          className="h-9 w-9 grid place-items-center rounded-md border border-border hover:bg-destructive/20 hover:text-destructive"
          title="Clear"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
