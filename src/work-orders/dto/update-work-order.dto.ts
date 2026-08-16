import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { WorkOrderStatus } from '../../common/enums';

export class UpdateWorkOrderDto {
  @IsOptional() @IsEnum(WorkOrderStatus) status?: WorkOrderStatus;
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) estimatedTotal?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) actualTotal?: number;
  @IsOptional() @IsUUID() technicianId?: string;
}
