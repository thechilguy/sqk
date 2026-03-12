import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Square = 'X' | 'O' | null;

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(code: string, userId: number | undefined, socketId: string) {
    return this.prisma.room.create({
      data: {
        code,
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'waiting',
        players: {
          create: { userId: userId ?? null, player: 'X', socketId },
        },
      },
      include: { players: true },
    });
  }

  async joinRoom(code: string, userId: number | undefined, socketId: string) {
    const room = await this.prisma.room.findUnique({
      where: { code },
      include: { players: true },
    });

    if (!room || room.players.length >= 2) return null;

    await this.prisma.roomPlayer.create({
      data: { roomId: room.id, userId: userId ?? null, player: 'O', socketId },
    });

    return this.prisma.room.update({
      where: { code },
      data: { status: 'playing' },
      include: { players: true },
    });
  }

  async getRoom(code: string) {
    return this.prisma.room.findUnique({
      where: { code },
      include: { players: true },
    });
  }

  async updateBoard(code: string, board: Square[], currentTurn: 'X' | 'O') {
    return this.prisma.room.update({
      where: { code },
      data: { board, currentTurn },
    });
  }

  async updateSocketId(code: string, userId: number | undefined, oldSocketId: string | undefined, newSocketId: string) {
    if (userId) {
      await this.prisma.roomPlayer.updateMany({
        where: { room: { code }, userId },
        data: { socketId: newSocketId },
      });
    } else if (oldSocketId) {
      await this.prisma.roomPlayer.updateMany({
        where: { room: { code }, socketId: oldSocketId },
        data: { socketId: newSocketId },
      });
    }
  }
}
