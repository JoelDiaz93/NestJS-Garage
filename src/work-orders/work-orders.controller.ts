import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { User } from '../users/user.entity';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrdersService } from './work-orders.service';

@ApiTags('work-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Post('from-quote/:quoteId')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR)
  fromQuote(@Param('quoteId') quoteId: string) {
    return this.service.fromQuote(quoteId);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/consume-materials')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR, UserRole.TECHNICIAN)
  consumeMaterials(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.consumeMaterials(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR, UserRole.TECHNICIAN)
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user);
  }
}
