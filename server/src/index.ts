// HTTP + Socket.IO bootstrap.
// Run with `npm run dev` after `npm install` and `npm run prisma:migrate`.
import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

import { GameManager } from "./classes/GameManager";
import { registerSocketHandlers } from "./socket/handlers";

const PORT = Number(process.env.PORT ?? 4000);

const ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:8080,http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const app = express();
  app.use(cors({ origin: ORIGINS, credentials: true }));
  app.use(express.json());

  // Basic rate limiter on HTTP routes
  app.use(
    rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }),
  );

  app.get("/", (_req, res) => res.json({ ok: true, name: "Scribble Clone-server" }));
  app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: ORIGINS, credentials: true },
    transports: ["websocket"],
  });

  const manager = new GameManager(io, prisma);
  registerSocketHandlers(io, manager);

  httpServer.listen(PORT, () => {
    console.log(`Scribble Clone server listening on :${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
