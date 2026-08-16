import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { StockMovementReason } from '../../common/enums';

export class AdjustStockDto {
  @Type(() => Number)
  @IsInt()
  quantity: number;

  @IsEnum(StockMovementReason)
  reason: StockMovementReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
