import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { WorkOrder } from '../../work-orders/work-order.entity';

@Entity('work_order_evidence')
export class Evidence {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column('uuid') workOrderId: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column() filename: string;
  @Column() originalName: string;
  @Column() mimeType: string;
  @Column('int') size: number;
  @Column('uuid', { nullable: true }) uploadedByUserId?: string;
  @CreateDateColumn() createdAt: Date;
}
