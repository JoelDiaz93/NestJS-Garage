import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CatalogItemType, UserRole } from '../common/enums';
import { CatalogItem } from '../catalog/catalog-item.entity';
import { User } from '../users/user.entity';
@Injectable()
export class SeedService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>, @InjectRepository(CatalogItem) private readonly catalog: Repository<CatalogItem>, private readonly config: ConfigService) {}
  async run() {
    if (this.config.get('SEED_ENABLED', 'false') !== 'true') throw new ForbiddenException('Seed is disabled');
    const adminEmail = 'admin@garageflow.local';
    if (!(await this.users.exist({ where: { email: adminEmail } }))) await this.users.save(this.users.create({ email: adminEmail, password: await bcrypt.hash('Admin123!', 12), fullName: 'GarageFlow Admin', roles: [UserRole.ADMIN] }));
    if (await this.catalog.count() === 0) await this.catalog.save([
      this.catalog.create({ sku: 'SRV-OIL-001', name: 'Cambio de aceite y filtro', type: CatalogItemType.SERVICE, price: 35, cost: 0, stock: 0 }),
      this.catalog.create({ sku: 'PRD-OIL-5W30', name: 'Aceite sintético 5W-30', type: CatalogItemType.PRODUCT, price: 38, cost: 25, stock: 12, minStock: 4 }),
      this.catalog.create({ sku: 'SRV-DIAG-001', name: 'Diagnóstico general', type: CatalogItemType.SERVICE, price: 25, cost: 0, stock: 0 }),
    ]);
    return { ok: true, admin: adminEmail, temporaryPassword: 'Admin123! - change immediately' };
  }
}
