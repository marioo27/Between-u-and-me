import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { normalizeDeviceId } from './device.js';
import {
  addSeat,
  claimSeats,
  createRoom,
  gameAction,
  getRoom,
  isHostSocket,
  joinRoom,
  leaveSocket,
  publicState,
  removeSeat,
  setSeats,
  startGame,
} from './rooms.js';
import type { GameId, ImpostorSetup } from './types.js';

const PORT = Number(process.env.PORT ?? 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';

const app = express();
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'between-u-and-me-api' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
  },
});

function emitRoom(code: string): void {
  const room = getRoom(code);
  if (!room) return;
  for (const socketId of room.connectedSocketIds) {
    const sock = io.sockets.sockets.get(socketId);
    if (sock) {
      sock.emit('room:state', publicState(room, socketId));
    }
  }
}

function requireDevice(payload: { deviceId?: string } | undefined): string {
  return normalizeDeviceId(payload?.deviceId);
}

io.on('connection', (socket) => {
  socket.on(
    'room:create',
    (payload: { game?: GameId; deviceId?: string }, ack?: (r: unknown) => void) => {
      try {
        const game = payload?.game;
        if (game !== 'nhie' && game !== 'impostor' && game !== 'whoami') {
          throw new Error('Invalid game');
        }
        const deviceId = requireDevice(payload);
        const room = createRoom(game, socket.id, deviceId);
        void socket.join(room.code);
        const state = publicState(room, socket.id);
        ack?.({ ok: true, state });
        socket.emit('room:state', state);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        ack?.({ ok: false, error: message });
        socket.emit('room:error', { message });
      }
    },
  );

  socket.on(
    'room:join',
    (payload: { code?: string; deviceId?: string }, ack?: (r: unknown) => void) => {
      try {
        const code = String(payload?.code ?? '')
          .trim()
          .toUpperCase();
        const deviceId = requireDevice(payload);
        const room = joinRoom(code, socket.id, deviceId);
        void socket.join(room.code);
        emitRoom(room.code);
        ack?.({ ok: true, state: publicState(room, socket.id) });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        ack?.({ ok: false, error: message });
        socket.emit('room:error', { message });
      }
    },
  );

  socket.on(
    'room:setSeats',
    (payload: { code?: string; names?: string[] }, ack?: (r: unknown) => void) => {
      try {
        const room = getRoom(String(payload?.code ?? ''));
        if (!room) throw new Error('Room not found');
        if (!isHostSocket(room, socket.id)) throw new Error('Only host');
        setSeats(room, payload?.names ?? []);
        emitRoom(room.code);
        ack?.({ ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        ack?.({ ok: false, error: message });
      }
    },
  );

  socket.on(
    'room:addSeat',
    (payload: { code?: string; name?: string }, ack?: (r: unknown) => void) => {
      try {
        const room = getRoom(String(payload?.code ?? ''));
        if (!room) throw new Error('Room not found');
        if (!isHostSocket(room, socket.id)) throw new Error('Only host');
        addSeat(room, String(payload?.name ?? ''));
        emitRoom(room.code);
        ack?.({ ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        ack?.({ ok: false, error: message });
      }
    },
  );

  socket.on(
    'room:removeSeat',
    (payload: { code?: string; seatId?: string }, ack?: (r: unknown) => void) => {
      try {
        const room = getRoom(String(payload?.code ?? ''));
        if (!room) throw new Error('Room not found');
        if (!isHostSocket(room, socket.id)) throw new Error('Only host');
        removeSeat(room, String(payload?.seatId ?? ''));
        emitRoom(room.code);
        ack?.({ ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        ack?.({ ok: false, error: message });
      }
    },
  );

  socket.on(
    'room:claim',
    (payload: { code?: string; seatIds?: string[] }, ack?: (r: unknown) => void) => {
      try {
        const room = getRoom(String(payload?.code ?? ''));
        if (!room) throw new Error('Room not found');
        claimSeats(room, socket.id, payload?.seatIds ?? []);
        emitRoom(room.code);
        ack?.({ ok: true, state: publicState(room, socket.id) });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        ack?.({ ok: false, error: message });
        socket.emit('room:error', { message });
      }
    },
  );

  socket.on(
    'room:start',
    (
      payload: {
        code?: string;
        locale?: 'es' | 'en';
        impostorSetup?: ImpostorSetup;
      },
      ack?: (r: unknown) => void,
    ) => {
      try {
        const room = getRoom(String(payload?.code ?? ''));
        if (!room) throw new Error('Room not found');
        startGame(room, socket.id, {
          locale: payload?.locale,
          impostorSetup: payload?.impostorSetup,
        });
        emitRoom(room.code);
        ack?.({ ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        ack?.({ ok: false, error: message });
        socket.emit('room:error', { message });
      }
    },
  );

  socket.on(
    'game:action',
    (
      payload: { code?: string; action?: string; data?: Record<string, unknown> },
      ack?: (r: unknown) => void,
    ) => {
      try {
        const room = getRoom(String(payload?.code ?? ''));
        if (!room) throw new Error('Room not found');
        gameAction(room, socket.id, String(payload?.action ?? ''), payload?.data);
        emitRoom(room.code);
        ack?.({ ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        ack?.({ ok: false, error: message });
        socket.emit('room:error', { message });
      }
    },
  );

  socket.on('disconnect', () => {
    const touched = leaveSocket(socket.id);
    for (const room of touched) {
      emitRoom(room.code);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
