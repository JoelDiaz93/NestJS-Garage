import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'; import { InjectRepository } from '@nestjs/typeorm'; import { Repository } from 'typeorm'; import { isUniqueViolation } from '../common/database-errors'; import { ClientsService } from '../clients/clients.service'; import { CreateVehicleDto } from './dto/create-vehicle.dto'; import { UpdateVehicleDto } from './dto/update-vehicle.dto'; import { Vehicle } from './vehicle.entity';
@Injectable() export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>, private readonly clients: ClientsService) {}
  async create(dto: CreateVehicleDto) {
    await this.clients.findOne(dto.clientId);
    try {
      return await this.repo.save(this.repo.create({ ...dto, plate: dto.plate.toUpperCase().trim() }));
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Vehicle plate already registered');
      throw error;
    }
  }
  findAll(clientId?: string) { return this.repo.find({ where: clientId ? { clientId } : {}, order: { plate: 'ASC' } }); }
  async findOne(id: string) { const row = await this.repo.findOneBy({ id }); if (!row) throw new NotFoundException('Vehicle not found'); return row; }
  async update(id: string, dto: UpdateVehicleDto) {
    const row = await this.findOne(id);
    if (dto.clientId) await this.clients.findOne(dto.clientId);
    Object.assign(row, dto);
    if (row.plate) row.plate = row.plate.toUpperCase().trim();
    try { return await this.repo.save(row); }
    catch (error) { if (isUniqueViolation(error)) throw new ConflictException('Vehicle plate already registered'); throw error; }
  }
  async remove(id: string) { const row = await this.findOne(id); await this.repo.remove(row); return { deleted: true, id }; }
}
