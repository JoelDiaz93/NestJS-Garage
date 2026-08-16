import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { isUniqueViolation } from '../common/database-errors';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(@InjectRepository(Client) private readonly repo: Repository<Client>) {}

  async create(dto: CreateClientDto) {
    try {
      return await this.repo.save(this.repo.create({
        ...dto,
        document: this.normalizeDocument(dto.document),
        email: dto.email?.toLowerCase().trim(),
      }));
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Client document already registered');
      throw error;
    }
  }

  findAll(search?: string) {
    const term = search?.trim();
    return this.repo.find({
      where: term
        ? [{ fullName: ILike(`%${term}%`) }, { document: ILike(`%${term}%`) }]
        : {},
      order: { fullName: 'ASC' },
    });
  }

  async findOne(id: string) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException('Client not found');
    return row;
  }

  async update(id: string, dto: UpdateClientDto) {
    const row = await this.findOne(id);
    Object.assign(row, dto);
    if (dto.document) row.document = this.normalizeDocument(dto.document);
    if (dto.email) row.email = dto.email.toLowerCase().trim();
    try {
      return await this.repo.save(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Client document already registered');
      throw error;
    }
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    row.active = false;
    return this.repo.save(row);
  }

  private normalizeDocument(value: string): string {
    return value.replace(/\s+/g, '').toUpperCase();
  }
}
