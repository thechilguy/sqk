import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { WebSocketServer } from '@nestjs/websockets';

interface Room {
  players: { socketId: string; player: 'X' | 'O' }[];
}

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, Room>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('create_room')
  handleCreateRoom(@ConnectedSocket() client: Socket) {
    const roomCode = String(Math.floor(1000 + Math.random() * 9000));
    this.rooms.set(roomCode, { players: [{ socketId: client.id, player: 'X' }] });
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

    room.players.push({ socketId: client.id, player: 'O' });
    client.join(data.roomCode);
    console.log(`Client ${client.id} joined room ${data.roomCode} as O`);

    const gameState = { board: Array(9).fill(null), currentTurn: 'X' };
    this.server.to(data.roomCode).emit('game_start', gameState);
    console.log(`game_start emitted to room ${data.roomCode}`);

    return { roomCode: data.roomCode, player: 'O' };
  }
}
