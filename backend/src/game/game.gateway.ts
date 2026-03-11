import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface RoomPlayer {
  socketId: string;
  player: 'X' | 'O';
  userId?: string;
}

interface Room {
  players: RoomPlayer[];
  board: ('X' | 'O' | null)[];
  currentTurn: 'X' | 'O';
}

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, Room>();

  constructor(private readonly jwtService: JwtService) {}

  private extractUserId(client: Socket): string | undefined {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) return undefined;
    try {
      const payload = this.jwtService.verify(token);
      return payload.sub as string;
    } catch {
      return undefined;
    }
  }

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    console.log(`Client connected: ${client.id}${userId ? ` (userId: ${userId})` : ''}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('create_room')
  handleCreateRoom(@ConnectedSocket() client: Socket) {
    const userId = this.extractUserId(client);
    const roomCode = String(Math.floor(1000 + Math.random() * 9000));
    this.rooms.set(roomCode, {
      players: [{ socketId: client.id, player: 'X', userId }],
      board: Array(9).fill(null),
      currentTurn: 'X',
    });
    client.join(roomCode);
    console.log(`Room created: ${roomCode} by ${client.id}`);
    return { roomCode, player: 'X' };
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room || room.players.length >= 2) {
      console.log(`Join failed for room ${data.roomCode} by ${client.id}: not found or full`);
      return { error: 'Room not found or full' };
    }

    const userId = this.extractUserId(client);
    room.players.push({ socketId: client.id, player: 'O', userId });
    client.join(data.roomCode);
    console.log(`Client ${client.id} joined room ${data.roomCode} as O`);

    const gameState = { board: room.board, currentTurn: room.currentTurn };
    this.server.to(data.roomCode).emit('game_start', gameState);
    console.log(`game_start emitted to room ${data.roomCode}`);

    return { roomCode: data.roomCode, player: 'O' };
  }

  @SubscribeMessage('rejoin_room')
  handleRejoinRoom(
    @MessageBody() data: { roomCode: string; oldSocketId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);
    if (!room) {
      console.log(`rejoin_room failed: room ${data.roomCode} not found`);
      return { error: 'Room not found' };
    }

    const userId = this.extractUserId(client);

    // Match by userId first, fall back to oldSocketId for unauthenticated clients
    let roomPlayer = userId
      ? room.players.find((p) => p.userId === userId)
      : undefined;

    if (!roomPlayer && data.oldSocketId) {
      roomPlayer = room.players.find((p) => p.socketId === data.oldSocketId);
      if (roomPlayer) {
        console.log(`rejoin_room: matched by oldSocketId ${data.oldSocketId}`);
      }
    }

    if (!roomPlayer) {
      console.log(`rejoin_room failed: no matching player in room ${data.roomCode}`);
      return { error: 'Player not in room' };
    }

    roomPlayer.socketId = client.id;
    client.join(data.roomCode);
    console.log(`Client ${client.id} rejoined room ${data.roomCode} as ${roomPlayer.player}`);

    client.emit('game_rejoined', {
      board: room.board,
      currentTurn: room.currentTurn,
      player: roomPlayer.player,
    });

    return { roomCode: data.roomCode, player: roomPlayer.player };
  }

  @SubscribeMessage('make_move')
  handleMakeMove(
    @MessageBody() data: { roomCode: string; index: number; player: 'X' | 'O' },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) {
      console.log(`make_move failed: room ${data.roomCode} not found`);
      return;
    }

    if (room.currentTurn !== data.player) {
      console.log(`make_move rejected: not ${data.player}'s turn in room ${data.roomCode}`);
      return;
    }

    if (room.board[data.index] !== null) {
      console.log(`make_move rejected: square ${data.index} already taken in room ${data.roomCode}`);
      return;
    }

    room.board[data.index] = data.player;
    room.currentTurn = data.player === 'X' ? 'O' : 'X';

    console.log(`make_move: ${data.player} played index ${data.index} in room ${data.roomCode}`);

    this.server.to(data.roomCode).emit('move_made', {
      board: room.board,
      currentTurn: room.currentTurn,
    });
  }
}
