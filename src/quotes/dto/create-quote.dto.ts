import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class CreateQuoteItemDto {
  @IsUUID() catalogItemId: string;
  @Type(() => Number) @IsNumber() @Min(0.01) quantity: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) unitPrice?: number;
}

export class CreateQuoteDto {
  @IsUUID() clientId: string;
  @IsUUID() vehicleId: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) discountPct?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(90) validityDays?: number;
}
