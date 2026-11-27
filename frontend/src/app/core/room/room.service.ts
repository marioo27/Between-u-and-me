import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { getDeviceId } from './device-id';
import type { GameId, ImpostorSetup, PublicRoomState } from './room.types';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private socket: Socket | null = null;
  private roomCode: string | null = null;

  readonly state = signal<PublicRoomState | null>(null);
  readonly connecting = signal(false);
  readonly waking = signal(false);
  readonly error = signal<string | null>(null);

  connect(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }
    this.connecting.set(true);
    this.waking.set(true);
    this.error.set(null);

    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      const socket = io(environment.apiUrl, {
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 8,
        timeout: 20000,
      });
      this.socket = socket;

      let settled = false;
      const finishOk = () => {
        if (settled) return;
        settled = true;
        this.connecting.set(false);
        this.waking.set(false);
        this.error.set(null);
        clearTimeout(failTimer);
        socket.off('connect', onConnect);
        socket.off('connect_error', onTransientError);
        resolve();
      };
      const finishFail = (message: string) => {
        if (settled) return;
        settled = true;
        this.connecting.set(false);
        this.waking.set(false);
        this.error.set(message);
        clearTimeout(failTimer);
        socket.off('connect', onConnect);
        socket.off('connect_error', onTransientError);
        socket.disconnect();
        this.socket = null;
        reject(new Error(message));
      };

      const onConnect = () => finishOk();
      const onTransientError = () => {
        this.waking.set(true);
      };

      const failTimer = setTimeout(() => {
        finishFail('Room server unreachable');
      }, 20000);

      socket.on('connect', onConnect);
      socket.on('connect_error', onTransientError);
      socket.on('room:state', (state: PublicRoomState) => {
        this.state.set(state);
        this.roomCode = state.code;
        this.error.set(null);
      });
      socket.on('room:error', (payload: { message?: string }) => {
        this.error.set(payload?.message ?? 'Error');
      });
      socket.io.on('reconnect', () => {
        const code = this.roomCode;
        if (code) {
          void this.join(code).catch(() => {
            /* error signal set by join */
          });
        }
      });

      void fetch(`${environment.apiUrl}/api/health`).catch(() => {
        /* wake attempt (Render free tier) */
      });
    });
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.roomCode = null;
    this.state.set(null);
  }

  private emit<T>(event: string, payload: unknown): Promise<T> {
    const socket = this.socket;
    if (!socket?.connected) {
      return Promise.reject(new Error('Not connected'));
    }
    return new Promise((resolve, reject) => {
      socket.timeout(15000).emit(event, payload, (err: Error | null, res: T) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  }

  async create(game: GameId): Promise<PublicRoomState> {
    await this.connect();
    const res = await this.emit<{ ok: boolean; state?: PublicRoomState; error?: string }>(
      'room:create',
      { game, deviceId: getDeviceId() },
    );
    if (!res.ok || !res.state) {
      throw new Error(res.error ?? 'Create failed');
    }
    this.state.set(res.state);
    this.roomCode = res.state.code;
    return res.state;
  }

  async join(code: string): Promise<PublicRoomState> {
    await this.connect();
    const res = await this.emit<{ ok: boolean; state?: PublicRoomState; error?: string }>(
      'room:join',
      { code, deviceId: getDeviceId() },
    );
    if (!res.ok || !res.state) {
      throw new Error(res.error ?? 'Join failed');
    }
    this.state.set(res.state);
    this.roomCode = res.state.code;
    return res.state;
  }

  async setSeats(names: string[]): Promise<void> {
    const code = this.state()?.code;
    if (!code) return;
    await this.emit('room:setSeats', { code, names });
  }

  async addSeat(name: string): Promise<void> {
    const code = this.state()?.code;
    if (!code) return;
    await this.emit('room:addSeat', { code, name });
  }

  async removeSeat(seatId: string): Promise<void> {
    const code = this.state()?.code;
    if (!code) return;
    await this.emit('room:removeSeat', { code, seatId });
  }

  async claim(seatIds: string[]): Promise<void> {
    const code = this.state()?.code;
    if (!code) return;
    const res = await this.emit<{ ok: boolean; error?: string }>('room:claim', {
      code,
      seatIds,
    });
    if (!res.ok) throw new Error(res.error ?? 'Claim failed');
  }

  async start(payload?: {
    locale?: 'es' | 'en';
    impostorSetup?: ImpostorSetup;
  }): Promise<void> {
    const code = this.state()?.code;
    if (!code) return;
    const res = await this.emit<{ ok: boolean; error?: string }>('room:start', {
      code,
      ...payload,
    });
    if (!res.ok) throw new Error(res.error ?? 'Start failed');
  }

  async action(action: string, data?: Record<string, unknown>): Promise<void> {
    const code = this.state()?.code;
    if (!code) return;
    const res = await this.emit<{ ok: boolean; error?: string }>('game:action', {
      code,
      action,
      data,
    });
    if (!res.ok) throw new Error(res.error ?? 'Action failed');
  }
}
