// Room class — owns the state of a single game room.
// Knows about its players, current game phase, scoring, and timers.
// Broadcasts via the injected Socket.IO Server.
import type { Server, Socket } from "socket.io";
import type { PrismaClient } from "@prisma/client";
import { Player } from "./Player";
import { WordManager } from "./WordManager";
import type {
  GamePhase,
  PublicRoomState,
  RoomSettings,
  WordOption,
} from "../types";

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: "chat" | "system" | "correct" | "close";
  color?: string;
}

export class Room {
  code: string;
  hostId: string;
  players = new Map<string, Player>();
  settings: RoomSettings;
  phase: GamePhase = "lobby";
  round = 0;
  drawerId: string | null = null;
  word = "";
  wordMask = "";
  wordCategory = "";
  timeLeft = 0;
  // strokes are kept so newly-joined players see the in-progress canvas
  strokes: any[] = [];
  // queue of player ids who still need to draw this round
  drawQueue: string[] = [];
  // map of who guessed correctly this round + how many points they got
  correctGuessers = new Set<string>();
  private timer: NodeJS.Timeout | null = null;
  private revealTimers: NodeJS.Timeout[] = [];
  private wordOptions: WordOption[] = [];

  constructor(
    code: string,
    hostId: string,
    settings: RoomSettings,
    private io: Server,
    private prisma: PrismaClient,
    private wordManager: WordManager,
    private onEmpty: (code: string) => void,
  ) {
    this.code = code;
    this.hostId = hostId;
    this.settings = settings;
  }

  // --- Lifecycle ---------------------------------------------------------
  addPlayer(socket: Socket, name: string): Player | null {
    if (this.players.size >= this.settings.maxPlayers) return null;
    const player = new Player(socket.id, name, this.players.size === 0);
    if (player.isHost) this.hostId = socket.id;
    this.players.set(socket.id, player);
    socket.join(this.code);
    socket.data.roomCode = this.code;
    this.system(`${name} joined the room`);
    this.io.to(this.code).emit("player_joined", this.toPublic());
    // give the new player the in-flight canvas
    socket.emit("canvas_state", this.strokes);
    return player;
  }

  removePlayer(socketId: string) {
    const p = this.players.get(socketId);
    if (!p) return;
    this.players.delete(socketId);
    this.system(`${p.name} left`);

    if (this.players.size === 0) {
      this.cleanup();
      this.onEmpty(this.code);
      return;
    }

    // promote a new host if needed
    if (p.isHost) {
      const next = this.players.values().next().value as Player | undefined;
      if (next) {
        next.isHost = true;
        this.hostId = next.id;
      }
    }

    // if the drawer left mid-round, end the round early
    if (this.drawerId === socketId && this.phase === "drawing") {
      this.endRound();
      return;
    }

    this.io.to(this.code).emit("player_left", this.toPublic());
  }

  // --- Game flow ---------------------------------------------------------
  startGame() {
    if (this.phase !== "lobby" || this.players.size < 2) return;
    this.players.forEach((p) => (p.score = 0));
    this.round = 0;
    this.drawQueue = [];
    this.nextTurn();
  }

  private nextTurn() {
    if (this.drawQueue.length === 0) {
      this.round += 1;
      if (this.round > this.settings.rounds) return this.endGame();
      // refill queue with current player order
      this.drawQueue = [...this.players.keys()];
    }
    const drawerId = this.drawQueue.shift()!;
    const drawer = this.players.get(drawerId);
    if (!drawer) return this.nextTurn();

    this.players.forEach((p) => {
      p.isDrawer = p.id === drawerId;
      p.hasGuessed = false;
    });
    this.drawerId = drawerId;
    this.correctGuessers.clear();
    this.strokes = [];
    this.phase = "choosing";

    this.io.to(this.code).emit("canvas_clear");
    this.io.to(this.code).emit("room_state", this.toPublic());

    // give the drawer 3 word options; auto-pick after 15s
    this.wordManager.getOptions(3).then((opts) => {
      this.wordOptions = opts;
      this.io.to(drawerId).emit("word_options", opts);
      this.timer = setTimeout(() => {
        if (this.phase === "choosing") {
          this.chooseWord(opts[0].word);
        }
      }, 15_000);
    });
  }

  chooseWord(word: string) {
    if (this.phase !== "choosing") return;
    const match = this.wordOptions.find((o) => o.word === word) ?? this.wordOptions[0];
    this.word = match.word.toLowerCase();
    this.wordCategory = match.category;
    this.wordMask = WordManager.mask(this.word);
    this.phase = "drawing";
    this.timeLeft = this.settings.drawTime;
    if (this.timer) clearTimeout(this.timer);

    this.io.to(this.code).emit("word_chosen");
    this.io.to(this.code).emit("round_start", this.toPublic());
    this.io.to(this.drawerId!).emit("room_patch", { fullWord: this.word });

    this.scheduleHints();
    this.startCountdown();
  }

  private scheduleHints() {
    this.revealTimers.forEach(clearTimeout);
    this.revealTimers = [];
    const total = this.settings.drawTime;
    for (let i = 1; i <= this.settings.hintCount; i++) {
      const at = Math.floor((total / (this.settings.hintCount + 1)) * i) * 1000;
      const t = setTimeout(() => {
        if (this.phase !== "drawing") return;
        this.wordMask = WordManager.revealMore(this.word, this.wordMask, 1);
        this.io.to(this.code).emit("room_patch", { wordMask: this.wordMask });
      }, total * 1000 - at);
      this.revealTimers.push(t);
    }
  }

  private startCountdown() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.io.to(this.code).emit("room_patch", { timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) this.endRound();
    }, 1000);
  }

  private endRound() {
    if (this.phase === "round_end" || this.phase === "lobby") return;
    if (this.timer) clearInterval(this.timer);
    this.revealTimers.forEach(clearTimeout);
    this.timer = null;
    this.phase = "round_end";

    // drawer bonus = average of guessers' scores this round? simple version:
    const drawer = this.players.get(this.drawerId!);
    if (drawer && this.correctGuessers.size > 0) {
      drawer.score += 50 + this.correctGuessers.size * 20;
    }

    const revealed = this.word;
    this.io.to(this.code).emit("round_end", {
      word: revealed,
      room: this.toPublic(),
    });

    // brief intermission, then next turn
    setTimeout(() => this.nextTurn(), 5000);
  }

  private endGame() {
    if (this.timer) clearInterval(this.timer);
    this.revealTimers.forEach(clearTimeout);
    this.timer = null;
    this.phase = "game_over";
    const winners = [...this.players.values()]
      .map((p) => p.toPublic())
      .sort((a, b) => b.score - a.score);

    // persist match history (best-effort)
    if (winners[0]) {
      this.prisma.matchHistory
        .create({
          data: {
            roomCode: this.code,
            winnerName: winners[0].name,
            winnerScore: winners[0].score,
            totalRounds: this.settings.rounds,
            playerCount: this.players.size,
          },
        })
        .catch(() => {});
    }

    const state = this.toPublic();
    state.winners = winners;
    this.io.to(this.code).emit("game_over", state);

    // back to lobby after a delay so a new game can start
    setTimeout(() => {
      this.phase = "lobby";
      this.round = 0;
      this.drawerId = null;
      this.players.forEach((p) => {
        p.isDrawer = false;
        p.hasGuessed = false;
      });
      this.io.to(this.code).emit("room_state", this.toPublic());
    }, 12_000);
  }

  // --- Chat / guessing ---------------------------------------------------
  handleGuess(playerId: string, text: string) {
    const player = this.players.get(playerId);
    if (!player) return;
    if (this.phase !== "drawing") {
      // outside of drawing phase, treat as plain chat
      return this.broadcastChat(player, text, "chat");
    }
    if (player.isDrawer) return; // drawer can't chat
    if (player.hasGuessed) return; // already guessed correctly

    const guess = text.trim().toLowerCase();
    if (guess === this.word) {
      player.hasGuessed = true;
      this.correctGuessers.add(player.id);
      const points = Math.max(50, Math.floor((this.timeLeft / this.settings.drawTime) * 200) + 50);
      player.score += points;

      this.io.to(this.code).emit("chat_message", {
        id: cryptoId(),
        playerId: player.id,
        playerName: player.name,
        text: `guessed the word! +${points}`,
        type: "correct",
        color: player.avatarColor,
      } satisfies ChatMessage);

      this.io.to(this.code).emit("room_patch", {
        players: [...this.players.values()].map((p) => p.toPublic()),
      });

      // everyone (except drawer) guessed → end round early
      const guessers = [...this.players.values()].filter((p) => !p.isDrawer);
      if (guessers.every((p) => p.hasGuessed)) this.endRound();
      return;
    }

    // "close" hint: same length, differs by 1 char (Levenshtein-1 lite)
    const isClose =
      guess.length === this.word.length && oneCharDiff(guess, this.word);
    if (isClose) {
      this.io.to(playerId).emit("chat_message", {
        id: cryptoId(),
        playerId: "system",
        playerName: "System",
        text: `"${text}" is close!`,
        type: "close",
      } satisfies ChatMessage);
      // still broadcast plain chat to others
      this.broadcastChatExcept(player, text, playerId);
      return;
    }

    this.broadcastChat(player, text, "chat");
  }

  private broadcastChat(player: Player, text: string, type: ChatMessage["type"]) {
    this.io.to(this.code).emit("chat_message", {
      id: cryptoId(),
      playerId: player.id,
      playerName: player.name,
      text,
      type,
      color: player.avatarColor,
    } satisfies ChatMessage);
  }

  private broadcastChatExcept(player: Player, text: string, exceptId: string) {
    this.players.forEach((_p, id) => {
      if (id === exceptId) return;
      this.io.to(id).emit("chat_message", {
        id: cryptoId(),
        playerId: player.id,
        playerName: player.name,
        text,
        type: "chat",
        color: player.avatarColor,
      } satisfies ChatMessage);
    });
  }

  private system(text: string) {
    this.io.to(this.code).emit("system_message", text);
  }

  // --- Drawing relay -----------------------------------------------------
  // Server doesn't validate stroke geometry — it just relays from the drawer.
  relayDrawStart(socketId: string, payload: any) {
    if (socketId !== this.drawerId) return;
    this.strokes.push({
      id: payload.strokeId,
      color: payload.color,
      size: payload.size,
      tool: payload.tool,
      points: [{ x: payload.x, y: payload.y }],
    });
    this.io.to(this.code).except(socketId).emit("draw_start", payload);
  }
  relayDrawMove(socketId: string, payload: any) {
    if (socketId !== this.drawerId) return;
    const stroke = this.strokes.find((s) => s.id === payload.strokeId);
    if (stroke) stroke.points.push({ x: payload.x, y: payload.y });
    this.io.to(this.code).except(socketId).emit("draw_move", payload);
  }
  relayDrawEnd(socketId: string, payload: any) {
    if (socketId !== this.drawerId) return;
    this.io.to(this.code).except(socketId).emit("draw_end", payload);
  }
  clearCanvas(socketId: string) {
    if (socketId !== this.drawerId) return;
    this.strokes = [];
    this.io.to(this.code).emit("canvas_clear");
  }
  undoStroke(socketId: string) {
    if (socketId !== this.drawerId) return;
    this.strokes.pop();
    this.io.to(this.code).emit("draw_undo");
  }

  // --- Serialization -----------------------------------------------------
  toPublic(): PublicRoomState {
    return {
      code: this.code,
      hostId: this.hostId,
      players: [...this.players.values()].map((p) => p.toPublic()),
      settings: this.settings,
      phase: this.phase,
      round: this.round,
      totalRounds: this.settings.rounds,
      drawerId: this.drawerId,
      wordMask: this.wordMask,
      wordLength: this.word.length,
      timeLeft: this.timeLeft,
    };
  }

  cleanup() {
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
    }
    this.revealTimers.forEach(clearTimeout);
  }
}

function cryptoId() {
  return Math.random().toString(36).slice(2, 11);
}

function oneCharDiff(a: string, b: string) {
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++;
    if (diff > 1) return false;
  }
  return diff === 1;
}
