import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CatalogService } from '../catalog/catalog.service';
import { ClientsService } from '../clients/clients.service';
import { CatalogItemType, QuoteStatus } from '../common/enums';
import { calculateQuoteTotals, roundMoney } from '../common/money';
import { assertQuoteTransition } from '../common/status-transitions';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteItem } from './quote-item.entity';
import { Quote } from './quote.entity';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote) private readonly repo: Repository<Quote>,
    @InjectRepository(QuoteItem) private readonly itemRepo: Repository<QuoteItem>,
    private readonly catalog: CatalogService,
    private readonly clients: ClientsService,
    private readonly vehicles: VehiclesService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateQuoteDto, createdByUserId?: string) {
    await this.clients.findOne(dto.clientId);
    const vehicle = await this.vehicles.findOne(dto.vehicleId);
    if (vehicle.clientId !== dto.clientId) {
      throw new BadRequestException('Vehicle does not belong to client');
    }

    const items: QuoteItem[] = [];
    for (const input of dto.items) {
      const catalogItem = await this.catalog.findOne(input.catalogItemId);
      if (!catalogItem.active) throw new BadRequestException(`Catalog item ${catalogItem.sku} is inactive`);
      const unitPrice = Number(input.unitPrice ?? catalogItem.price);
      const quantity = Number(input.quantity);
      if (catalogItem.type === CatalogItemType.PRODUCT && !Number.isInteger(quantity)) {
        throw new BadRequestException(`Product quantity for ${catalogItem.sku} must be a whole number`);
      }
      items.push(
        this.itemRepo.create({
          catalogItemId: catalogItem.id,
          sku: catalogItem.sku,
          description: catalogItem.name,
          type: catalogItem.type,
          unitPrice,
          quantity,
          lineTotal: roundMoney(unitPrice * quantity),
        }),
      );
    }

    const taxRate = Number(this.config.get('TAX_RATE', '0.15'));
    const discountPct = Number(dto.discountPct ?? 0);
    const totals = calculateQuoteTotals(items.map((item) => Number(item.lineTotal)), taxRate, discountPct);
    const validityDays = dto.validityDays ?? Number(this.config.get('QUOTE_VALIDITY_DAYS', '15'));
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    const quote = this.repo.create({
      number: this.generateNumber('Q'),
      clientId: dto.clientId,
      vehicleId: dto.vehicleId,
      notes: dto.notes,
      items,
      discountPct,
      taxRate,
      expiresAt,
      createdByUserId,
      ...totals,
    });
    return this.repo.save(quote);
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException('Quote not found');
    return row;
  }

  async updateStatus(id: string, status: QuoteStatus) {
    const row = await this.findOne(id);
    const now = new Date();

    if (status === QuoteStatus.APPROVED && row.expiresAt < now) {
      row.status = QuoteStatus.EXPIRED;
      await this.repo.save(row);
      throw new BadRequestException('Expired quotes cannot be approved');
    }

    assertQuoteTransition(row.status, status);
    row.status = status;
    if (status === QuoteStatus.APPROVED) row.approvedAt = now;
    if (status === QuoteStatus.REJECTED) row.rejectedAt = now;
    return this.repo.save(row);
  }

  private generateNumber(prefix: string): string {
    const year = new Date().getUTCFullYear();
    return `${prefix}-${year}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
