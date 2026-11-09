import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceRequestDto } from './dto/update-maintenance-request.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles('TENANT')
  @ApiOperation({ summary: 'Create a maintenance request for an active agreement' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMaintenanceRequestDto) {
    return this.maintenanceService.create(user.sub, dto);
  }

  @Get('my')
  @Roles('TENANT')
  @ApiOperation({ summary: 'List maintenance requests created by the current tenant' })
  mine(@CurrentUser() user: JwtPayload) {
    return this.maintenanceService.mine(user.sub);
  }

  @Get('received')
  @Roles('LANDLORD')
  @ApiOperation({ summary: 'List maintenance requests for the current landlord' })
  received(@CurrentUser() user: JwtPayload) {
    return this.maintenanceService.received(user.sub);
  }

  @Patch(':id/status')
  @Roles('LANDLORD')
  @ApiOperation({ summary: 'Update a maintenance request status as its landlord' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMaintenanceRequestDto,
  ) {
    return this.maintenanceService.updateStatus(id, user.sub, dto.status);
  }
}
