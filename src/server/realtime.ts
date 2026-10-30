/**
 * SchoolVerse Realtime Campus Multiplayer Hub
 * Authoritative school-room broadcaster with WebSocket server & Supabase protocol compatibility
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import { sqlite } from './db.ts';

interface ClientConnection {
  ws: WebSocket;
  studentId: string;
  schoolId: string;
  displayName: string;
  username: string;
  avatar: string;
  level: number;
  schoolCode: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  currentZone: string;
  lastPing: number;
}

// Map of schoolId -> Map of studentId -> ClientConnection
const campusRooms = new Map<string, Map<string, ClientConnection>>();

export function setupCampusWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const studentId = url.searchParams.get('studentId');
      const schoolId = url.searchParams.get('schoolId');

      if (!studentId || !schoolId) {
        ws.close(1008, 'Missing studentId or schoolId');
        return;
      }

      // Verify student identity & school in database
      const student = sqlite.prepare(`
        SELECT s.id, s.display_name, s.username, s.avatar, s.level, s.school_id, sch.code as school_code
        FROM students s
        JOIN schools sch ON s.school_id = sch.id
        WHERE s.id = ? AND s.school_id = ?
      `).get(studentId, schoolId) as any;

      if (!student) {
        ws.close(1008, 'Unauthorized: student does not belong to this school');
        return;
      }

      const client: ClientConnection = {
        ws,
        studentId,
        schoolId,
        displayName: student.display_name,
        username: student.username,
        avatar: student.avatar,
        level: student.level,
        schoolCode: student.school_code,
        x: 960,
        y: 1216,
        direction: 'down',
        isMoving: false,
        currentZone: 'courtyard',
        lastPing: Date.now(),
      };

      if (!campusRooms.has(schoolId)) {
        campusRooms.set(schoolId, new Map());
      }
      const room = campusRooms.get(schoolId)!;

      // Close previous connection if same student had one open
      const existing = room.get(studentId);
      if (existing && existing.ws !== ws && existing.ws.readyState === WebSocket.OPEN) {
        try { existing.ws.close(); } catch {}
      }
      room.set(studentId, client);

      // Send initial state to the newly joined player: list of all existing online players
      const otherPlayers: any[] = [];
      for (const [otherId, otherClient] of room.entries()) {
        if (otherId !== studentId) {
          otherPlayers.push({
            studentId: otherClient.studentId,
            displayName: otherClient.displayName,
            username: otherClient.username,
            avatar: otherClient.avatar,
            level: otherClient.level,
            schoolCode: otherClient.schoolCode,
            x: otherClient.x,
            y: otherClient.y,
            direction: otherClient.direction,
            isMoving: otherClient.isMoving,
            currentZone: otherClient.currentZone,
          });
        }
      }

      ws.send(JSON.stringify({
        type: 'room_state',
        channel: `campus:${schoolId}`,
        self: {
          studentId: client.studentId,
          x: client.x,
          y: client.y,
        },
        players: otherPlayers,
        onlineCount: room.size,
      }));

      // Broadcast join event to all other players in this school
      broadcastToSchool(schoolId, studentId, {
        type: 'player_joined',
        channel: `campus:${schoolId}`,
        player: {
          studentId: client.studentId,
          displayName: client.displayName,
          username: client.username,
          avatar: client.avatar,
          level: client.level,
          schoolCode: client.schoolCode,
          x: client.x,
          y: client.y,
          direction: client.direction,
          isMoving: client.isMoving,
          currentZone: client.currentZone,
        },
        onlineCount: room.size,
      });

      // Handle incoming messages
      ws.on('message', (data: string) => {
        try {
          const msg = JSON.parse(data.toString());
          client.lastPing = Date.now();

          if (msg.type === 'move') {
            client.x = typeof msg.x === 'number' ? msg.x : client.x;
            client.y = typeof msg.y === 'number' ? msg.y : client.y;
            client.direction = msg.direction || client.direction;
            client.isMoving = Boolean(msg.isMoving);
            client.currentZone = msg.currentZone || client.currentZone;

            // Broadcast movement to peers in same school
            broadcastToSchool(schoolId, studentId, {
              type: 'player_moved',
              channel: `campus:${schoolId}`,
              studentId,
              x: client.x,
              y: client.y,
              direction: client.direction,
              isMoving: client.isMoving,
              currentZone: client.currentZone,
              timestamp: Date.now(),
            });
          } else if (msg.type === 'chat_bubble') {
            // Emote or short text bubble above avatar
            broadcastToSchool(schoolId, '', {
              type: 'player_chat_bubble',
              channel: `campus:${schoolId}`,
              studentId,
              displayName: client.displayName,
              message: String(msg.message || '').slice(0, 100),
              timestamp: Date.now(),
            });
          } else if (msg.type === 'heartbeat') {
            ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
          }
        } catch (err) {
          console.error('[Campus Realtime] Error parsing client message:', err);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        handleClientLeave(schoolId, studentId);
      });

      ws.on('error', (err) => {
        console.error('[Campus Realtime] Socket error for student:', studentId, err);
        handleClientLeave(schoolId, studentId);
      });

    } catch (err) {
      console.error('[Campus Realtime] Connection initialization failed:', err);
      try { ws.close(); } catch {}
    }
  });

  console.log('[SchoolVerse] Multiplayer Campus WebSocket server active.');
}

function handleClientLeave(schoolId: string, studentId: string) {
  const room = campusRooms.get(schoolId);
  if (room && room.has(studentId)) {
    room.delete(studentId);
    const count = room.size;
    if (count === 0) {
      campusRooms.delete(schoolId);
    }
    broadcastToSchool(schoolId, studentId, {
      type: 'player_left',
      channel: `campus:${schoolId}`,
      studentId,
      onlineCount: count,
    });
  }
}

function broadcastToSchool(schoolId: string, excludeStudentId: string, payload: any) {
  const room = campusRooms.get(schoolId);
  if (!room) return;

  const data = JSON.stringify(payload);
  for (const [id, client] of room.entries()) {
    if (id !== excludeStudentId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(data);
      } catch (err) {
        console.error('[Campus Realtime] Broadcast error to', id, err);
      }
    }
  }
}

export function getActiveCampusPlayers(schoolId: string): any[] {
  const room = campusRooms.get(schoolId);
  if (!room) return [];
  const list: any[] = [];
  for (const client of room.values()) {
    list.push({
      studentId: client.studentId,
      displayName: client.displayName,
      username: client.username,
      avatar: client.avatar,
      level: client.level,
      schoolCode: client.schoolCode,
      x: client.x,
      y: client.y,
      direction: client.direction,
      isMoving: client.isMoving,
      currentZone: client.currentZone,
    });
  }
  return list;
}
