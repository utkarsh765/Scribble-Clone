interface Props {
  mask: string;       // "_ a _ _" — guesser view
  fullWord?: string;  // drawer-only
  isDrawer: boolean;
  length: number;
}

export function WordHint({ mask, fullWord, isDrawer, length }: Props) {
  const display = isDrawer && fullWord ? fullWord : mask;
  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
        {isDrawer ? "Draw this word" : "Guess the word"}
      </div>
      <div className="font-mono text-2xl sm:text-3xl tracking-[0.3em] font-bold">
        {display.split("").map((c, i) => (
          <span key={i} className={c === "_" ? "text-muted-foreground" : ""}>
            {c}
          </span>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{length} letters</div>
    </div>
  );
}
