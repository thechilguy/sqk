import { Injectable, ConflictException } from '@nestjs/common';

export interface User {
  id: number;
  email: string;
  password: string;
}

@Injectable()
export class UsersService {
  private users: User[] = [];
  private idCounter = 1;

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email);
  }

  async create(email: string, hashedPassword: string): Promise<User> {
    if (await this.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }
    const user: User = { id: this.idCounter++, email, password: hashedPassword };
    this.users.push(user);
    return user;
  }
}
