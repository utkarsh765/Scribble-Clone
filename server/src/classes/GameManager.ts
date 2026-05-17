// GameManager: top-level registry of rooms.
// Every Socket.IO handler talks to the GameManager, which routes to a Room.
import type { Server } from "socket.io";
import type { PrismaClient } from "@prisma/client";
import { Room } from "./Room";
import { WordManager } from "./WordManager";
import type { RoomSettings } from "../types";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars

export class GameManager {
  private rooms = new Map<string, Room>();
  private wordManager: WordManager;

  constructor(private io: Server, private prisma: PrismaClient) {
    this.wordManager = new WordManager(prisma);
  }

  createRoom(hostSocketId: string, settings: RoomSettings) {
    const code = this.makeUniqueCode();
    const room = new Room(
      code,
      hostSocketId,
      settings,
      this.io,
      this.prisma,
      this.wordManager,
      (c) => this.rooms.delete(c),
    );
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string) {
    return this.rooms.get(code.toUpperCase());
  }

  /** Look up the room a socket is in by reading its joined rooms. */
  findRoomBySocket(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) return room;
    }
    return undefined;
  }

  private makeUniqueCode(): string {
    for (let i = 0; i < 20; i++) {
      let code = "";
      for (let j = 0; j < 5; j++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    // fallback
    return Date.now().toString(36).toUpperCase().slice(-5);
  }
}
