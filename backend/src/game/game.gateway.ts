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
import { Cron, CronExpression } from '@nestjs/schedule';
import { GameService } from './game.service';

type Square = 'X' | 'O' | null;

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getWinner(board: Square[]): 'X' | 'O' | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as 'X' | 'O';
    }
  }
  return null;
}

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly gameService: GameService,
  ) {}

  private extractUserId(client: Socket): number | undefined {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) return undefined;
    try {
      const payload = this.jwtService.verify(token);
      return payload.sub as number;
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

  @Cron(CronExpression.EVERY_MINUTE)
  async handleStaleRoomCleanup() {
    const count = await this.gameService.deleteStaleRooms();
    if (count > 0) console.log(`Stale room cleanup: deleted ${count} room(s)`);
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(@ConnectedSocket() client: Socket) {
    const userId = this.extractUserId(client);
    const roomCode = String(Math.floor(1000 + Math.random() * 9000));
    await this.gameService.createRoom(roomCode, userId, client.id);
    client.join(roomCode);
    console.log(`Room created: ${roomCode} by ${client.id}`);
    return { roomCode, player: 'X' };
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.extractUserId(client);
    const room = await this.gameService.joinRoom(data.roomCode, userId, client.id);

    if (!room) {
      console.log(`Join failed for room ${data.roomCode} by ${client.id}: not found or full`);
      return { error: 'Room not found or full' };
    }

    client.join(data.roomCode);
    console.log(`Client ${client.id} joined room ${data.roomCode} as O`);

    const board = room.board as Square[];
    this.server.to(data.roomCode).emit('game_start', { board, currentTurn: room.currentTurn });
    console.log(`game_start emitted to room ${data.roomCode}`);

    return { roomCode: data.roomCode, player: 'O' };
  }

  @SubscribeMessage('rejoin_room')
  async handleRejoinRoom(
    @MessageBody() data: { roomCode: string; oldSocketId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.gameService.getRoom(data.roomCode);
    if (!room) {
      console.log(`rejoin_room failed: room ${data.roomCode} not found`);
      return { error: 'Room not found' };
    }

    const userId = this.extractUserId(client);

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

    await this.gameService.updateSocketId(data.roomCode, userId, data.oldSocketId, client.id);
    client.join(data.roomCode);
    console.log(`Client ${client.id} rejoined room ${data.roomCode} as ${roomPlayer.player}`);

    const board = room.board as Square[];
    client.emit('game_rejoined', {
      board,
      currentTurn: room.currentTurn,
      player: roomPlayer.player,
    });

    return { roomCode: data.roomCode, player: roomPlayer.player };
  }

  @SubscribeMessage('make_move')
  async handleMakeMove(
    @MessageBody() data: { roomCode: string; index: number; player: 'X' | 'O' },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.gameService.getRoom(data.roomCode);

    if (!room) {
      console.log(`make_move failed: room ${data.roomCode} not found`);
      return;
    }

    if (room.currentTurn !== data.player) {
      console.log(`make_move rejected: not ${data.player}'s turn in room ${data.roomCode}`);
      return;
    }

    const board = room.board as Square[];
    if (board[data.index] !== null) {
      console.log(`make_move rejected: square ${data.index} already taken in room ${data.roomCode}`);
      return;
    }

    board[data.index] = data.player;
    const nextTurn = data.player === 'X' ? 'O' : 'X';
    await this.gameService.updateBoard(data.roomCode, board, nextTurn);

    console.log(`make_move: ${data.player} played index ${data.index} in room ${data.roomCode}`);

    const winner = getWinner(board);
    const isDraw = !winner && board.every(Boolean);

    if (winner || isDraw) {
      const result = winner ?? 'draw';
      console.log(`Game over in room ${data.roomCode}: ${result}`);

      await this.gameService.finishRoom(data.roomCode);
      this.server.to(data.roomCode).emit('game_over', { winner: result });

      setTimeout(async () => {
        await this.gameService.deleteRoom(data.roomCode);
        console.log(`Room ${data.roomCode} deleted after game over`);
      }, 5000);
    } else {
      this.server.to(data.roomCode).emit('move_made', { board, currentTurn: nextTurn });
    }
  }
}
