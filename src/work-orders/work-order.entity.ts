import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Client } from '../clients/client.entity';
import { WorkOrderStatus } from '../common/enums';
import { Quote } from '../quotes/quote.entity';
import { User } from '../users/user.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true }) number: string;

  @Column({ type: 'enum', enum: WorkOrderStatus, enumName: 'work_order_status_enum', default: WorkOrderStatus.RECEIVED })
  status: WorkOrderStatus;

  @ManyToOne(() => Client, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clientId' }) client: Client;
  @Column('uuid') clientId: string;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicleId' }) vehicle: Vehicle;
  @Column('uuid') vehicleId: string;

  @ManyToOne(() => Quote, { eager: true, nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'quoteId' }) quote?: Quote;
  @Column('uuid', { nullable: true, unique: true }) quoteId?: string;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'technicianId' }) technician?: User;
  @Column('uuid', { nullable: true }) technicianId?: string;

  @Column({ type: 'text', nullable: true }) diagnosis?: string;
  @Column({ type: 'text', nullable: true }) notes?: string;
  @Column('numeric', { precision: 12, scale: 2, default: 0 }) estimatedTotal: number;
  @Column('numeric', { precision: 12, scale: 2, nullable: true }) actualTotal?: number;
  @Column({ type: 'timestamptz', nullable: true }) assignedAt?: Date;
  @Column({ type: 'timestamptz', nullable: true }) startedAt?: Date;
  @Column({ type: 'timestamptz', nullable: true }) completedAt?: Date;
  @Column({ type: 'timestamptz', nullable: true }) deliveredAt?: Date;
  @Column({ type: 'timestamptz', nullable: true }) stockConsumedAt?: Date;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
