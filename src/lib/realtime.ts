/**
 * SchoolVerse Realtime Client Engine
 * Integrates Supabase Realtime with automatic seamless WebSocket fallback
 * School-isolated channel: campus:<school_id>
 */

import { CampusPlayer, CampusMoveEvent } from '../types/index.ts';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface RealtimeCallbacks {
  onRoomState?: (players: CampusPlayer[], onlineCount: number) => void;
  onPlayerJoined?: (player: CampusPlayer, onlineCount: number) => void;
  onPlayerMoved?: (moveEvent: CampusMoveEvent) => void;
  onPlayerLeft?: (studentId: string, onlineCount: number) => void;
  onChatBubble?: (data: { studentId: string; displayName: string; message: string }) => void;
  onConnectionStatus?: (status: ConnectionStatus, provider: 'supabase' | 'websocket') => void;
}

export class CampusRealtimeClient {
  private socket: WebSocket | null = null;
  private supabaseChannel: any = null;
  private student: any = null;
  private schoolId: string = '';
  private callbacks: RealtimeCallbacks = {};
  private lastBroadcastTime = 0;
  private broadcastIntervalMs = 90; // ~11 updates/sec throttle
  private isDestroyed = false;
  private reconnectTimeout: any = null;
  private activeProvider: 'supabase' | 'websocket' = 'websocket';

  constructor(callbacks: RealtimeCallbacks) {
    this.callbacks = callbacks;
  }

  public async connect(student: any, schoolId: string) {
    this.student = student;
    this.schoolId = schoolId;
    this.isDestroyed = false;

    // Check if Supabase keys exist in environment
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        await this.connectSupabase(supabaseUrl, supabaseKey);
        return;
      } catch (err) {
        console.warn('[Realtime] Supabase connect failed, falling back to local WebSocket:', err);
      }
    }

    // Connect via native WebSocket
    this.connectWebSocket();
  }

  private async connectSupabase(supabaseUrl: string, supabaseKey: string) {
    this.activeProvider = 'supabase';
    this.callbacks.onConnectionStatus?.('connecting', 'supabase');

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const channelName = `campus:${this.schoolId}`;
    this.supabaseChannel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: this.student.id },
      },
    });

    this.supabaseChannel
      .on('broadcast', { event: 'player_moved' }, ({ payload }: any) => {
        this.callbacks.onPlayerMoved?.(payload);
      })
      .on('broadcast', { event: 'player_chat_bubble' }, ({ payload }: any) => {
        this.callbacks.onChatBubble?.(payload);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = this.supabaseChannel.presenceState();
        const players: CampusPlayer[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key];
          if (presences && presences[0] && key !== this.student.id) {
            players.push(presences[0] as CampusPlayer);
          }
        }
        this.callbacks.onRoomState?.(players, players.length + 1);
      })
      .on('presence', { event: 'join' }, ({ newPresences }: any) => {
        if (newPresences && newPresences[0] && newPresences[0].studentId !== this.student.id) {
          this.callbacks.onPlayerJoined?.(newPresences[0], 0);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        if (leftPresences && leftPresences[0]) {
          this.callbacks.onPlayerLeft?.(leftPresences[0].studentId, 0);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.callbacks.onConnectionStatus?.('connected', 'supabase');
          this.supabaseChannel.track({
            studentId: this.student.id,
            displayName: this.student.displayName || this.student.display_name,
            username: this.student.username,
            avatar: this.student.avatar,
            level: this.student.level,
            schoolCode: this.student.schoolCode || this.student.school_code,
            x: 960,
            y: 1216,
            direction: 'down',
            isMoving: false,
          });
        }
      });
  }

  private connectWebSocket() {
    this.activeProvider = 'websocket';
    this.callbacks.onConnectionStatus?.('connecting', 'websocket');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/campus?studentId=${encodeURIComponent(this.student.id)}&schoolId=${encodeURIComponent(this.schoolId)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.callbacks.onConnectionStatus?.('connected', 'websocket');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'room_state') {
            this.callbacks.onRoomState?.(data.players || [], data.onlineCount || 1);
          } else if (data.type === 'player_joined') {
            this.callbacks.onPlayerJoined?.(data.player, data.onlineCount);
          } else if (data.type === 'player_moved') {
            this.callbacks.onPlayerMoved?.(data);
          } else if (data.type === 'player_left') {
            this.callbacks.onPlayerLeft?.(data.studentId, data.onlineCount);
          } else if (data.type === 'player_chat_bubble') {
            this.callbacks.onChatBubble?.(data);
          }
        } catch (err) {
          console.error('[Campus Realtime Client] Failed to parse message:', err);
        }
      };

      this.socket.onclose = () => {
        if (!this.isDestroyed) {
          this.callbacks.onConnectionStatus?.('reconnecting', 'websocket');
          this.reconnectTimeout = setTimeout(() => {
            if (!this.isDestroyed) this.connectWebSocket();
          }, 3000);
        } else {
          this.callbacks.onConnectionStatus?.('disconnected', 'websocket');
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[Campus Realtime Client] Socket warning:', err);
      };
    } catch (err) {
      console.error('[Campus Realtime Client] Connection error:', err);
      this.callbacks.onConnectionStatus?.('disconnected', 'websocket');
    }
  }

  public sendMovement(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right', isMoving: boolean, currentZone: string) {
    const now = Date.now();
    // Throttle movement broadcasts to ~11 fps when moving, but always broadcast stopping/idle immediately
    if (isMoving && now - this.lastBroadcastTime < this.broadcastIntervalMs) {
      return;
    }
    this.lastBroadcastTime = now;

    if (this.activeProvider === 'supabase' && this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'player_moved',
        payload: {
          studentId: this.student.id,
          schoolId: this.schoolId,
          x,
          y,
          direction,
          isMoving,
          currentZone,
          timestamp: now,
        },
      });
    } else if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'move',
        x,
        y,
        direction,
        isMoving,
        currentZone,
      }));
    }
  }

  public sendChatBubble(message: string) {
    if (!message.trim()) return;

    if (this.activeProvider === 'supabase' && this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'player_chat_bubble',
        payload: {
          studentId: this.student.id,
          displayName: this.student.displayName,
          message,
          timestamp: Date.now(),
        },
      });
    } else if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'chat_bubble',
        message,
      }));
    }
  }

  public disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }

    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.unsubscribe();
      } catch {}
      this.supabaseChannel = null;
    }

    this.callbacks.onConnectionStatus?.('disconnected', this.activeProvider);
  }
}
