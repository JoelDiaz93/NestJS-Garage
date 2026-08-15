import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Client } from './client.entity'; import { CreateClientDto } from './dto/create-client.dto'; import { UpdateClientDto } from './dto/update-client.dto';
@Injectable() export class ClientsService {
  constructor(@InjectRepository(Client) private readonly repo: Repository<Client>) {}
  create(dto: CreateClientDto) { return this.repo.save(this.repo.create(dto)); }
  findAll(search?: string) { return this.repo.find({ where: search ? [{ fullName: ILike(`%${search}%`) }, { document: ILike(`%${search}%`) }] : {}, order: { fullName: 'ASC' } }); }
  async findOne(id: string) { const row = await this.repo.findOneBy({ id }); if (!row) throw new NotFoundException('Client not found'); return row; }
  async update(id: string, dto: UpdateClientDto) { const row = await this.findOne(id); Object.assign(row, dto); return this.repo.save(row); }
  async remove(id: string) { const row = await this.findOne(id); row.active = false; return this.repo.save(row); }
}
