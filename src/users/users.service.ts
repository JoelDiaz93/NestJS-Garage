import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../auth/refresh-token.entity';
import { isUniqueViolation } from '../common/database-errors';
import { UserRole } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.repo.exist({ where: { email } })) throw new BadRequestException('Email already registered');
    const user = this.repo.create({ ...dto, email, password: await bcrypt.hash(dto.password, 12) });
    try {
      const saved = await this.repo.save(user);
      return this.toSafeUser(saved);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Email already registered');
      throw error;
    }
  }

  findAll() {
    return this.repo.find({
      select: { id: true, email: true, fullName: true, roles: true, isActive: true },
      order: { fullName: 'ASC' },
    });
  }

  async findAssignableTechnicians() {
    const users = await this.repo.find({
      select: { id: true, email: true, fullName: true, roles: true, isActive: true },
      where: { isActive: true },
      order: { fullName: 'ASC' },
    });
    return users.filter((user) =>
      user.roles.includes(UserRole.TECHNICIAN) || user.roles.includes(UserRole.ADMIN),
    );
  }

  async findById(id: string) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const user = await this.findById(id);
    if (id === actorId) {
      if (dto.isActive === false) throw new BadRequestException('You cannot deactivate your own account');
      if (dto.roles && !dto.roles.includes(UserRole.ADMIN)) {
        throw new BadRequestException('You cannot remove your own admin role');
      }
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.roles !== undefined) user.roles = dto.roles;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    const saved = await this.repo.save(user);
    if (dto.isActive === false) await this.revokeSessions(id);
    return this.toSafeUser(saved);
  }

  async resetPassword(id: string, dto: ResetUserPasswordDto) {
    const user = await this.findById(id);
    user.password = await bcrypt.hash(dto.password, 12);
    await this.repo.save(user);
    await this.revokeSessions(id);
    return { updated: true, userId: id, sessionsRevoked: true };
  }

  private async revokeSessions(userId: string) {
    await this.refreshTokens.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  private toSafeUser(user: User) {
    const { password: _password, ...safe } = user;
    return safe;
  }
}
