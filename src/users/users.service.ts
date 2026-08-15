import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}
  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.repo.exist({ where: { email } })) throw new BadRequestException('Email already registered');
    const user = this.repo.create({ ...dto, email, password: await bcrypt.hash(dto.password, 12) });
    const saved = await this.repo.save(user);
    const { password, ...safe } = saved;
    return safe;
  }
  findAll() { return this.repo.find({ select: { id: true, email: true, fullName: true, roles: true, isActive: true } }); }
  async findById(id: string) { const user = await this.repo.findOneBy({ id }); if (!user) throw new NotFoundException('User not found'); return user; }
}
