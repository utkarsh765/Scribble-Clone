import { createFileRoute, Link } from "@tanstack/react-router";
import { Palette, Users, Sparkles, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scribble Clone" },
      {
        name: "description",
        content:
          "Hop into a room, sketch, and guess your way to the top in this real-time multiplayer drawing game.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3 w-3 text-primary" />
            Real-time multiplayer · Up to 20 players
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight">
            Sketch. Guess. <span className="gradient-text">Win.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Jump into a room with friends, take turns drawing, and race to guess the word before the
            timer runs out.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/create"
              className="px-6 py-3 rounded-xl gradient-bg-primary text-white font-semibold shadow-glow hover:opacity-90 transition"
            >
              Create a room
            </Link>
            <Link
              to="/join"
              className="px-6 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition font-semibold"
            >
              Join with code
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-24 grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Zap,
              title: "Real-time canvas",
              body: "Strokes sync instantly via WebSockets.",
            },
            {
              icon: Users,
              title: "Public & private",
              body: "Open lobbies or private rooms with codes.",
            },
            {
              icon: Palette,
              title: "Custom rounds",
              body: "Tweak draw time, rounds, and player limits.",
            },
          ].map((f) => (
            <div key={f.title} className="glass-panel rounded-2xl p-5">
              <div className="h-10 w-10 rounded-lg gradient-bg-primary grid place-items-center mb-3">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
