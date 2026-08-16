import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('LOWER(user.email) = LOWER(:email)', { email: dto.email.trim() })
      .getOne();

    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueSession(user);
  }

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = this.hashToken(dto.refreshToken);
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshToken);
      const stored = await repository.findOne({
        where: { tokenHash, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
        relations: { user: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!stored || !stored.user?.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      stored.revokedAt = new Date();
      await repository.save(stored);
      return this.issueSession(stored.user, repository);
    });
  }

  async logout(dto: RefreshTokenDto) {
    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.refreshTokens.findOneBy({ tokenHash });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshTokens.save(stored);
    }
    return { loggedOut: true };
  }

  private async issueSession(user: User, tokenRepository: Repository<RefreshToken> = this.refreshTokens) {
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email });
    const refreshToken = randomBytes(48).toString('base64url');
    const days = Number(this.config.get('REFRESH_TOKEN_DAYS', '7'));
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await tokenRepository.save(
      tokenRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      }),
    );

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toSafeUser(user: User) {
    const { password: _password, ...safe } = user;
    return safe;
  }
}
