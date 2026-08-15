import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>, private readonly jwt: JwtService) {}
  async login(dto: LoginDto) {
    const user = await this.repo.createQueryBuilder('user').addSelect('user.password').where('LOWER(user.email) = LOWER(:email)', { email: dto.email }).getOne();
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.password))) throw new UnauthorizedException('Invalid credentials');
    const { password, ...safe } = user;
    return { user: safe, accessToken: this.jwt.sign({ sub: user.id, email: user.email }) };
  }
}
