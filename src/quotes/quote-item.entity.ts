import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CatalogItemType } from '../common/enums';
import { Quote } from './quote.entity';

@Entity('quote_items')
export class QuoteItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') catalogItemId: string;
  @Column() sku: string;
  @Column() description: string;
  @Column({ type: 'enum', enum: CatalogItemType, enumName: 'catalog_item_type_enum' }) type: CatalogItemType;
  @Column('numeric', { precision: 12, scale: 2 }) unitPrice: number;
  @Column('numeric', { precision: 10, scale: 2, default: 1 }) quantity: number;
  @Column('numeric', { precision: 12, scale: 2 }) lineTotal: number;

  @ManyToOne(() => Quote, (quote) => quote.items, { onDelete: 'CASCADE' })
  quote: Quote;
}
