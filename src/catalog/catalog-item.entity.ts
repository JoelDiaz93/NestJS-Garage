import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CatalogItemType } from '../common/enums';

@Entity('catalog_items')
export class CatalogItem {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true })
  sku: string;

  @Index()
  @Column()
  name: string;

  @Column({ type: 'enum', enum: CatalogItemType, enumName: 'catalog_item_type_enum' })
  type: CatalogItemType;

  @Column('numeric', { precision: 12, scale: 2 })
  price: number;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  cost: number;

  @Column('int', { default: 0 })
  stock: number;

  @Column('int', { default: 0 })
  minStock: number;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
