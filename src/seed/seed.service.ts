import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CatalogItem } from '../catalog/catalog-item.entity';
import { InventoryMovement } from '../catalog/entities/inventory-movement.entity';
import { CatalogItemType, StockMovementReason, UserRole } from '../common/enums';
import { User } from '../users/user.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(CatalogItem) private readonly catalog: Repository<CatalogItem>,
    @InjectRepository(InventoryMovement) private readonly movements: Repository<InventoryMovement>,
    private readonly config: ConfigService,
  ) {}

  async run() {
    if (this.config.get('SEED_ENABLED', 'false') !== 'true') {
      throw new ForbiddenException('Seed is disabled');
    }

    const adminEmail = this.config.getOrThrow<string>('SEED_ADMIN_EMAIL').toLowerCase().trim();
    const adminPassword = this.config.getOrThrow<string>('SEED_ADMIN_PASSWORD');
    if (adminPassword.length < 12) throw new Error('SEED_ADMIN_PASSWORD must contain at least 12 characters');

    let admin = await this.users.findOneBy({ email: adminEmail });
    if (!admin) {
      admin = await this.users.save(
        this.users.create({
          email: adminEmail,
          password: await bcrypt.hash(adminPassword, 12),
          fullName: 'GarageFlow Administrator',
          roles: [UserRole.ADMIN],
        }),
      );
    }

    if (await this.catalog.count() === 0) {
      const saved = await this.catalog.save([
        this.catalog.create({ sku: 'SRV-OIL-001', name: 'Cambio de aceite y filtro', type: CatalogItemType.SERVICE, price: 35, cost: 0, stock: 0 }),
        this.catalog.create({ sku: 'PRD-OIL-5W30', name: 'Aceite sintético 5W-30', type: CatalogItemType.PRODUCT, price: 38, cost: 25, stock: 12, minStock: 4 }),
        this.catalog.create({ sku: 'SRV-DIAG-001', name: 'Diagnóstico general', type: CatalogItemType.SERVICE, price: 25, cost: 0, stock: 0 }),
      ]);

      const initialMovements = saved
        .filter((item) => item.type === CatalogItemType.PRODUCT && item.stock > 0)
        .map((item) => this.movements.create({
          catalogItemId: item.id,
          quantityChange: item.stock,
          stockBefore: 0,
          stockAfter: item.stock,
          reason: StockMovementReason.INITIAL,
          note: 'Demo seed initial stock',
          performedByUserId: admin.id,
        }));
      if (initialMovements.length) await this.movements.save(initialMovements);
    }

    return { ok: true, adminEmail, message: 'Seed completed. Credentials come only from environment variables.' };
  }
}
