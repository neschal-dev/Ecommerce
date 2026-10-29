import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(createUserDto: CreateUserDto) {
    return await this.prisma.orm.User.create(createUserDto);
  }
}
