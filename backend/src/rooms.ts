import { randomBytes } from 'node:crypto';
import type { GameId, ImpostorSetup, PublicRoomState, Room, Seat } from './types.js';
import { initNhie, nhieNext, nhiePublic } from './games/nhie.js';
import {
  impostorAdvanceReveal,
  impostorGoPlay,
  impostorReveal,
  impostorSecretsFor,
  startImpostorRound,
} from './games/impostor.js';
import { startWhoAmI, whoamiStartPlay, whoamiVisibleFor } from './games/whoami.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_TTL_MS = 1000 * 60 * 60 * 3;

const rooms = new Map<string, Room>();

function makeCode(): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const bytes = randomBytes(4);
    let code = '';
    for (let i = 0; i < 4; i += 1) {
      code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
    }
    if (!rooms.has(code)) return code;
  }
  throw new Error('Could not allocate room code');
}

function touch(room: Room): void {
  room.lastActiveAt = Date.now();
}

function seatId(): string {
  return `s_${randomBytes(4).toString('hex')}`;
}

export function cleanupRooms(): void {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActiveAt > ROOM_TTL_MS || room.connectedSocketIds.size === 0) {
      if (now - room.lastActiveAt > ROOM_TTL_MS) {
        rooms.delete(code);
      }
    }
  }
}

setInterval(cleanupRooms, 60_000).unref?.();

export function createRoom(game: GameId, hostSocketId: string): Room {
  const code = makeCode();
  const room: Room = {
    code,
    game,
    hostSocketId,
    phase: 'lobby',
    seats: [],
    claims: new Map(),
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    connectedSocketIds: new Set([hostSocketId]),
  };
  if (game === 'nhie') {
    initNhie(room, 'es');
  }
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function joinRoom(code: string, socketId: string): Room {
  const room = getRoom(code);
  if (!room) {
    throw new Error('Room not found');
  }
  room.connectedSocketIds.add(socketId);
  touch(room);
  return room;
}

export function leaveSocket(socketId: string): Room[] {
  const touched: Room[] = [];
  for (const room of rooms.values()) {
    if (!room.connectedSocketIds.has(socketId)) continue;
    room.connectedSocketIds.delete(socketId);
    room.claims.delete(socketId);
    if (room.hostSocketId === socketId) {
      const next = [...room.connectedSocketIds][0];
      if (next) room.hostSocketId = next;
    }
    touch(room);
    touched.push(room);
  }
  return touched;
}

export function setSeats(room: Room, names: string[]): void {
  if (room.game === 'nhie') {
    throw new Error('NHIE has no seats');
  }
  if (room.phase !== 'lobby') {
    throw new Error('Cannot edit seats now');
  }
  room.seats = names
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({ id: seatId(), name }));
  touch(room);
}

export function claimSeats(room: Room, socketId: string, seatIds: string[]): void {
  if (room.game === 'nhie') {
    throw new Error('NHIE has no claims');
  }
  const valid = new Set(room.seats.map((s) => s.id));
  const unique = [...new Set(seatIds.filter((id) => valid.has(id)))];

  for (const [otherSocket, claimed] of room.claims) {
    if (otherSocket === socketId) continue;
    for (const id of unique) {
      if (claimed.includes(id)) {
        throw new Error('Seat already claimed');
      }
    }
  }

  room.claims.set(socketId, unique);
  touch(room);
}

function claimsRecord(room: Room): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [socketId, seats] of room.claims) {
    out[socketId] = seats;
  }
  return out;
}

export function publicState(room: Room, socketId: string): PublicRoomState {
  const yourSeatIds = room.claims.get(socketId) ?? [];
  const base: PublicRoomState = {
    code: room.code,
    game: room.game,
    phase: room.phase,
    hostSocketId: room.hostSocketId,
    seats: room.seats,
    claims: claimsRecord(room),
    connectedCount: room.connectedSocketIds.size,
    youAreHost: room.hostSocketId === socketId,
    yourSeatIds,
  };

  if (room.game === 'nhie') {
    base.nhie = nhiePublic(room);
  }

  if (room.game === 'impostor' && room.impostor) {
    base.impostor = {
      ...room.impostor.public,
      yourSecrets: impostorSecretsFor(room, yourSeatIds),
    };
  }

  if (room.game === 'whoami' && room.whoami) {
    base.whoami = {
      ...room.whoami.public,
      visibleCharacters: whoamiVisibleFor(room, yourSeatIds),
    };
  }

  return base;
}

export function startGame(
  room: Room,
  socketId: string,
  payload?: {
    locale?: 'es' | 'en';
    impostorSetup?: ImpostorSetup;
  },
): void {
  if (room.hostSocketId !== socketId) {
    throw new Error('Only host can start');
  }

  if (room.game === 'nhie') {
    initNhie(room, payload?.locale ?? room.nhie?.locale ?? 'es');
    room.phase = 'playing';
    touch(room);
    return;
  }

  if (room.game === 'impostor') {
    const setup = payload?.impostorSetup;
    if (!setup) throw new Error('Missing impostor setup');
    startImpostorRound(room, setup);
    touch(room);
    return;
  }

  if (room.game === 'whoami') {
    startWhoAmI(room, payload?.locale ?? 'es');
    touch(room);
  }
}

export function gameAction(
  room: Room,
  socketId: string,
  action: string,
  data?: Record<string, unknown>,
): void {
  touch(room);

  if (room.game === 'nhie') {
    if (action === 'next') {
      if (room.hostSocketId !== socketId) throw new Error('Only host advances');
      nhieNext(room);
    }
    return;
  }

  if (room.game === 'impostor') {
    if (action === 'nextReveal') {
      if (room.hostSocketId !== socketId) throw new Error('Only host advances');
      impostorAdvanceReveal(room);
    } else if (action === 'goPlay') {
      if (room.hostSocketId !== socketId) throw new Error('Only host advances');
      impostorGoPlay(room);
    } else if (action === 'revealImpostors') {
      if (room.hostSocketId !== socketId) throw new Error('Only host reveals');
      impostorReveal(room);
    } else if (action === 'finishClaim') {
      if (room.hostSocketId !== socketId) throw new Error('Only host continues');
      room.phase = 'playing';
      if (room.impostor) room.impostor.public.phase = 'reveal';
    }
    return;
  }

  if (room.game === 'whoami') {
    if (action === 'finishClaim' || action === 'startPlay') {
      if (room.hostSocketId !== socketId) throw new Error('Only host continues');
      whoamiStartPlay(room);
    }
    void data;
  }
}

export function addSeat(room: Room, name: string): Seat {
  if (room.game === 'nhie') throw new Error('NHIE has no seats');
  if (room.phase !== 'lobby') throw new Error('Cannot edit seats now');
  const seat = { id: seatId(), name: name.trim().slice(0, 20) || '·' };
  room.seats.push(seat);
  touch(room);
  return seat;
}

export function removeSeat(room: Room, id: string): void {
  if (room.phase !== 'lobby') throw new Error('Cannot edit seats now');
  room.seats = room.seats.filter((s) => s.id !== id);
  touch(room);
}
