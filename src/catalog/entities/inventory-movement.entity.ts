import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StockMovementReason } from '../../common/enums';
import { CatalogItem } from '../catalog-item.entity';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column('uuid')
  catalogItemId: string;

  @ManyToOne(() => CatalogItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'catalogItemId' })
  catalogItem: CatalogItem;

  @Column('int') quantityChange: number;
  @Column('int') stockBefore: number;
  @Column('int') stockAfter: number;

  @Column({ type: 'enum', enum: StockMovementReason, enumName: 'stock_movement_reason_enum' })
  reason: StockMovementReason;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column('uuid', { nullable: true })
  performedByUserId?: string;

  @CreateDateColumn() createdAt: Date;
}
