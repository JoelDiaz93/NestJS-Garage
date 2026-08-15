import { Type } from 'class-transformer'; import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
export class CreateQuoteItemDto { @IsUUID() catalogItemId:string; @Type(()=>Number) @IsNumber() @Min(0.01) quantity:number; @IsOptional() @Type(()=>Number) @IsNumber() @Min(0) unitPrice?:number; }
export class CreateQuoteDto { @IsUUID() clientId:string; @IsUUID() vehicleId:string; @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>CreateQuoteItemDto) items:CreateQuoteItemDto[]; @IsOptional() @IsString() notes?:string; }
