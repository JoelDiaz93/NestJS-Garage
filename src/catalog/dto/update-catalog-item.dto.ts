import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCatalogItemDto } from './create-catalog-item.dto';

export class UpdateCatalogItemDto extends PartialType(
  OmitType(CreateCatalogItemDto, ['stock'] as const),
) {}
