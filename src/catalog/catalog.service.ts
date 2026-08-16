import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isUniqueViolation } from '../common/database-errors';
import { CatalogItemType, StockMovementReason } from '../common/enums';
import { CatalogItem } from './catalog-item.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { InventoryMovement } from './entities/inventory-movement.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CatalogItem) private readonly repo: Repository<CatalogItem>,
    @InjectRepository(InventoryMovement) private readonly movements: Repository<InventoryMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateCatalogItemDto, performedByUserId?: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(CatalogItem);
      const movementRepo = manager.getRepository(InventoryMovement);
      const initialStock = dto.type === CatalogItemType.PRODUCT ? Number(dto.stock ?? 0) : 0;
      const row = itemRepo.create({
        ...dto,
        sku: dto.sku.toUpperCase().trim(),
        stock: initialStock,
      });
      const saved = await itemRepo.save(row);

      if (initialStock > 0) {
        await movementRepo.save(
          movementRepo.create({
            catalogItemId: saved.id,
            quantityChange: initialStock,
            stockBefore: 0,
            stockAfter: initialStock,
            reason: StockMovementReason.INITIAL,
            note: 'Initial stock at catalog item creation',
            performedByUserId,
          }),
        );
      }
      return saved;
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Catalog SKU already registered');
      throw error;
    }
  }

  findAll() {
    return this.repo.find({ order: { type: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException('Catalog item not found');
    return row;
  }

  async update(id: string, dto: UpdateCatalogItemDto) {
    const row = await this.findOne(id);
    if (dto.type === CatalogItemType.SERVICE && row.stock > 0) {
      throw new BadRequestException('A product with stock cannot be converted to a service');
    }
    Object.assign(row, dto);
    if (dto.sku) row.sku = dto.sku.toUpperCase().trim();
    try {
      return await this.repo.save(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Catalog SKU already registered');
      throw error;
    }
  }

  async adjustStock(id: string, dto: AdjustStockDto, performedByUserId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(CatalogItem);
      const movementRepo = manager.getRepository(InventoryMovement);
      const row = await itemRepo
        .createQueryBuilder('item')
        .setLock('pessimistic_write')
        .where('item.id = :id', { id })
        .getOne();

      if (!row) throw new NotFoundException('Catalog item not found');
      if (dto.reason === StockMovementReason.INITIAL) {
        throw new BadRequestException('INITIAL is reserved for catalog item creation');
      }
      if (row.type !== CatalogItemType.PRODUCT) {
        throw new BadRequestException('Stock only applies to products');
      }

      const before = row.stock;
      const after = before + dto.quantity;
      if (after < 0) throw new BadRequestException('Insufficient stock');

      row.stock = after;
      await itemRepo.save(row);
      await movementRepo.save(
        movementRepo.create({
          catalogItemId: row.id,
          quantityChange: dto.quantity,
          stockBefore: before,
          stockAfter: after,
          reason: dto.reason,
          note: dto.note,
          performedByUserId,
        }),
      );
      return row;
    });
  }

  findLowStock() {
    return this.repo
      .createQueryBuilder('item')
      .where('item.type = :type', { type: CatalogItemType.PRODUCT })
      .andWhere('item.active = true')
      .andWhere('item.stock <= item.minStock')
      .orderBy('item.stock', 'ASC')
      .addOrderBy('item.name', 'ASC')
      .getMany();
  }

  findMovements(id: string) {
    return this.movements.find({
      where: { catalogItemId: id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
