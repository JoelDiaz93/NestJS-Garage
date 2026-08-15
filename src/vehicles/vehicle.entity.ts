import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'; import { Client } from '../clients/client.entity';
@Entity('vehicles') export class Vehicle {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) plate: string;
  @Column() make: string; @Column() model: string; @Column('int') year: number;
  @Column({ nullable: true }) vin?: string; @Column({ nullable: true }) color?: string; @Column({ type: 'int', nullable: true }) mileage?: number; @Column({ nullable: true }) notes?: string;
  @ManyToOne(() => Client, { eager: true, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'clientId' }) client: Client;
  @Column('uuid') clientId: string;
}
