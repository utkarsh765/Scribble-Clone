import { useEffect, useState } from "react";

export function Timer({ seconds }: { seconds: number }) {
  const [n, setN] = useState(seconds);
  useEffect(() => setN(seconds), [seconds]);
  useEffect(() => {
    if (n <= 0) return;
    const t = setInterval(() => setN((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [n]);
  const danger = n <= 10;
  return (
    <div
      className={`h-12 w-12 rounded-full grid place-items-center font-bold text-lg border-2 ${
        danger ? "border-destructive text-destructive animate-pulse" : "border-primary text-primary"
      } bg-background/60`}
    >
      {n}
    </div>
  );
}
