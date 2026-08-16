import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { User } from '../users/user.entity';
import { CatalogService } from './catalog.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';

@ApiTags('catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ADVISOR)
  create(@Body() dto: CreateCatalogItemDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('alerts/low-stock')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR)
  lowStock() {
    return this.service.findLowStock();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/movements')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR)
  movements(@Param('id') id: string) {
    return this.service.findMovements(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR)
  update(@Param('id') id: string, @Body() dto: UpdateCatalogItemDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/stock')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR)
  adjust(@Param('id') id: string, @Body() dto: AdjustStockDto, @CurrentUser() user: User) {
    return this.service.adjustStock(id, dto, user.id);
  }
}
