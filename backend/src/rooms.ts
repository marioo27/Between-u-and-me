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

function bindSocket(room: Room, socketId: string, deviceId: string): void {
  const previousSocket = room.socketByDevice.get(deviceId);
  if (previousSocket && previousSocket !== socketId) {
    room.connectedSocketIds.delete(previousSocket);
    room.deviceBySocket.delete(previousSocket);
  }
  room.deviceBySocket.set(socketId, deviceId);
  room.socketByDevice.set(deviceId, socketId);
  room.connectedSocketIds.add(socketId);
}

function deviceOf(room: Room, socketId: string): string {
  const deviceId = room.deviceBySocket.get(socketId);
  if (!deviceId) throw new Error('Unknown device');
  return deviceId;
}

export function isHostSocket(room: Room, socketId: string): boolean {
  return room.hostDeviceId === room.deviceBySocket.get(socketId);
}

function pickHost(room: Room): void {
  if (room.socketByDevice.has(room.hostDeviceId)) return;
  const nextDevice = [...room.socketByDevice.keys()][0];
  if (nextDevice) room.hostDeviceId = nextDevice;
}

export function cleanupRooms(): void {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActiveAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}

setInterval(cleanupRooms, 60_000).unref?.();

export function createRoom(game: GameId, hostSocketId: string, deviceId: string): Room {
  const code = makeCode();
  const room: Room = {
    code,
    game,
    hostDeviceId: deviceId,
    phase: 'lobby',
    seats: [],
    claims: new Map(),
    deviceBySocket: new Map(),
    socketByDevice: new Map(),
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    connectedSocketIds: new Set(),
  };
  bindSocket(room, hostSocketId, deviceId);
  if (game === 'nhie') {
    initNhie(room, 'es');
  }
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function joinRoom(code: string, socketId: string, deviceId: string): Room {
  const room = getRoom(code);
  if (!room) {
    throw new Error('Room not found');
  }
  bindSocket(room, socketId, deviceId);
  pickHost(room);
  touch(room);
  return room;
}

export function leaveSocket(socketId: string): Room[] {
  const touched: Room[] = [];
  for (const room of rooms.values()) {
    if (!room.connectedSocketIds.has(socketId)) continue;
    const deviceId = room.deviceBySocket.get(socketId);
    room.connectedSocketIds.delete(socketId);
    room.deviceBySocket.delete(socketId);
    if (deviceId && room.socketByDevice.get(deviceId) === socketId) {
      room.socketByDevice.delete(deviceId);
      // Keep claims for deviceId so reconnect restores seats.
    }
    pickHost(room);
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
  room.claims.clear();
  touch(room);
}

export function claimSeats(room: Room, socketId: string, seatIds: string[]): void {
  if (room.game === 'nhie') {
    throw new Error('NHIE has no claims');
  }
  const deviceId = deviceOf(room, socketId);
  const valid = new Set(room.seats.map((s) => s.id));
  const unique = [...new Set(seatIds.filter((id) => valid.has(id)))];

  for (const [otherDevice, claimed] of room.claims) {
    if (otherDevice === deviceId) continue;
    for (const id of unique) {
      if (claimed.includes(id)) {
        throw new Error('Seat already claimed');
      }
    }
  }

  room.claims.set(deviceId, unique);
  touch(room);
}

function claimsRecord(room: Room): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [deviceId, seats] of room.claims) {
    out[deviceId] = seats;
  }
  return out;
}

export function publicState(room: Room, socketId: string): PublicRoomState {
  const deviceId = room.deviceBySocket.get(socketId);
  const yourSeatIds = deviceId ? (room.claims.get(deviceId) ?? []) : [];
  const base: PublicRoomState = {
    code: room.code,
    game: room.game,
    phase: room.phase,
    hostDeviceId: room.hostDeviceId,
    seats: room.seats,
    claims: claimsRecord(room),
    connectedCount: room.connectedSocketIds.size,
    youAreHost: !!deviceId && room.hostDeviceId === deviceId,
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
  if (!isHostSocket(room, socketId)) {
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
      if (!isHostSocket(room, socketId)) throw new Error('Only host advances');
      nhieNext(room);
    }
    return;
  }

  if (room.game === 'impostor') {
    if (action === 'nextReveal') {
      if (!isHostSocket(room, socketId)) throw new Error('Only host advances');
      impostorAdvanceReveal(room);
    } else if (action === 'goPlay') {
      if (!isHostSocket(room, socketId)) throw new Error('Only host advances');
      impostorGoPlay(room);
    } else if (action === 'revealImpostors') {
      if (!isHostSocket(room, socketId)) throw new Error('Only host reveals');
      impostorReveal(room);
    } else if (action === 'finishClaim') {
      if (!isHostSocket(room, socketId)) throw new Error('Only host continues');
      room.phase = 'playing';
      if (room.impostor) room.impostor.public.phase = 'reveal';
    }
    return;
  }

  if (room.game === 'whoami') {
    if (action === 'finishClaim' || action === 'startPlay') {
      if (!isHostSocket(room, socketId)) throw new Error('Only host continues');
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
  for (const [deviceId, seats] of room.claims) {
    room.claims.set(
      deviceId,
      seats.filter((seat) => seat !== id),
    );
  }
  touch(room);
}
