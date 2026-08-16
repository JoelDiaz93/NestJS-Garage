import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogItem } from '../catalog/catalog-item.entity';
import { InventoryMovement } from '../catalog/entities/inventory-movement.entity';
import { randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { CatalogItemType, QuoteStatus, StockMovementReason, UserRole, WorkOrderStatus } from '../common/enums';
import { assertWorkOrderTransition } from '../common/status-transitions';
import { QuotesService } from '../quotes/quotes.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrder } from './work-order.entity';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder) private readonly repo: Repository<WorkOrder>,
    private readonly quotes: QuotesService,
    private readonly users: UsersService,
    private readonly realtime: RealtimeGateway,
    private readonly dataSource: DataSource,
  ) {}

  async fromQuote(quoteId: string) {
    const quote = await this.quotes.findOne(quoteId);
    if (quote.status !== QuoteStatus.APPROVED) {
      throw new BadRequestException('Quote must be approved before creating a work order');
    }

    const existing = await this.repo.findOneBy({ quoteId });
    if (existing) return existing;

    const row = this.repo.create({
      number: this.generateNumber(),
      clientId: quote.clientId,
      vehicleId: quote.vehicleId,
      quoteId: quote.id,
      estimatedTotal: Number(quote.total),
      status: WorkOrderStatus.RECEIVED,
    });
    const saved = await this.repo.save(row);
    this.realtime.emitWorkOrderUpdated(saved);
    return saved;
  }

  findAll() {
    return this.repo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException('Work order not found');
    return row;
  }

  async update(id: string, dto: UpdateWorkOrderDto, actor: User) {
    const row = await this.findOne(id);

    const isTechnicianOnly = actor.roles.includes(UserRole.TECHNICIAN) && !actor.roles.includes(UserRole.ADMIN) && !actor.roles.includes(UserRole.ADVISOR);
    if (isTechnicianOnly) {
      if (row.technicianId !== actor.id) {
        throw new BadRequestException('Technicians can only update work orders assigned to them');
      }
      if (dto.status && [WorkOrderStatus.CANCELLED, WorkOrderStatus.DELIVERED].includes(dto.status)) {
        throw new BadRequestException('Technicians cannot cancel or deliver work orders');
      }
      if (dto.technicianId !== undefined || dto.estimatedTotal !== undefined || dto.actualTotal !== undefined) {
        throw new BadRequestException('Technicians cannot reassign work orders or change financial totals');
      }
    }
    const now = new Date();

    if (dto.technicianId && dto.technicianId !== row.technicianId) {
      const technician = await this.users.findById(dto.technicianId);
      if (!technician.roles.includes(UserRole.TECHNICIAN) && !technician.roles.includes(UserRole.ADMIN)) {
        throw new BadRequestException('Assigned user must have technician or admin role');
      }
      row.technicianId = technician.id;
      row.assignedAt = now;
    }

    if (dto.status) {
      assertWorkOrderTransition(row.status, dto.status);
      if (dto.status === WorkOrderStatus.IN_PROGRESS && !row.startedAt) row.startedAt = now;
      if (dto.status === WorkOrderStatus.READY) row.completedAt = now;
      if (dto.status === WorkOrderStatus.DELIVERED) row.deliveredAt = now;
      row.status = dto.status;
    }

    if (dto.diagnosis !== undefined) row.diagnosis = dto.diagnosis;
    if (dto.notes !== undefined) row.notes = dto.notes;
    if (dto.estimatedTotal !== undefined) row.estimatedTotal = dto.estimatedTotal;
    if (dto.actualTotal !== undefined) row.actualTotal = dto.actualTotal;

    const saved = await this.repo.save(row);
    this.realtime.emitWorkOrderUpdated(saved);
    return saved;
  }

  async consumeMaterials(id: string, actor: User) {
    const result = await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(WorkOrder);
      const itemRepo = manager.getRepository(CatalogItem);
      const movementRepo = manager.getRepository(InventoryMovement);
      const order = await orderRepo.findOne({ where: { id }, relations: { quote: { items: true } } });
      if (!order) throw new NotFoundException('Work order not found');

      const isTechnicianOnly = actor.roles.includes(UserRole.TECHNICIAN) &&
        !actor.roles.includes(UserRole.ADMIN) && !actor.roles.includes(UserRole.ADVISOR);
      if (isTechnicianOnly && order.technicianId !== actor.id) {
        throw new BadRequestException('Technicians can only consume materials for work orders assigned to them');
      }
      if (order.stockConsumedAt) return { order, alreadyConsumed: true, movements: [] };
      if (!order.quote?.items?.length) throw new BadRequestException('Work order has no quote items to consume');
      if (![WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.READY].includes(order.status)) {
        throw new BadRequestException('Materials can only be consumed while the work order is in progress or ready');
      }

      const productLines = order.quote.items
        .filter((line) => line.type === CatalogItemType.PRODUCT)
        .sort((a, b) => a.catalogItemId.localeCompare(b.catalogItemId));
      const movements: InventoryMovement[] = [];

      for (const line of productLines) {
        const quantity = Number(line.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new BadRequestException(`Product quantity for ${line.sku} must be a positive integer`);
        }
        const item = await itemRepo.createQueryBuilder('item')
          .setLock('pessimistic_write')
          .where('item.id = :id', { id: line.catalogItemId })
          .getOne();
        if (!item || item.type !== CatalogItemType.PRODUCT) {
          throw new BadRequestException(`Product ${line.sku} no longer exists in catalog`);
        }
        if (item.stock < quantity) {
          throw new BadRequestException(`Insufficient stock for ${item.sku}: required ${quantity}, available ${item.stock}`);
        }
        const before = item.stock;
        item.stock -= quantity;
        await itemRepo.save(item);
        movements.push(await movementRepo.save(movementRepo.create({
          catalogItemId: item.id,
          quantityChange: -quantity,
          stockBefore: before,
          stockAfter: item.stock,
          reason: StockMovementReason.WORK_ORDER,
          note: `Consumed by work order ${order.number}`,
          performedByUserId: actor.id,
        })));
      }

      order.stockConsumedAt = new Date();
      const saved = await orderRepo.save(order);
      return { order: saved, alreadyConsumed: false, movements };
    });
    this.realtime.emitWorkOrderUpdated(result.order);
    return result;
  }

  async assertCanAttachEvidence(id: string, actor: User) {
    const row = await this.findOne(id);
    const isTechnicianOnly = actor.roles.includes(UserRole.TECHNICIAN) &&
      !actor.roles.includes(UserRole.ADMIN) &&
      !actor.roles.includes(UserRole.ADVISOR);
    if (isTechnicianOnly && row.technicianId !== actor.id) {
      throw new BadRequestException('Technicians can only attach evidence to work orders assigned to them');
    }
    return row;
  }

  private generateNumber(): string {
    const year = new Date().getUTCFullYear();
    return `WO-${year}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
