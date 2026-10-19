import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBoostOrderDto } from './dto/create-boost-order.dto';
import { BoostService } from './boost.service';

@ApiTags('boost')
@Controller('boost')
export class BoostController {
  constructor(private readonly boostService: BoostService) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'Get the available Rentra Boost products and prices',
  })
  catalog() {
    return this.boostService.getCatalog();
  }

  @Post('orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  @ApiOperation({
    summary:
      'Create a landlord boost order using server-side catalog prices; order remains pending until provider payment is verified',
  })
  createOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBoostOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.boostService.createOrder(user.sub, dto, idempotencyKey?.trim());
  }

  @Get('orders/my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  @ApiOperation({ summary: 'List boost orders owned by the current landlord' })
  async myOrders(@CurrentUser() user: JwtPayload) {
    const orders = await this.boostService.listOrders(user.sub);
    return { data: orders, count: orders.length };
  }

  @Get('orders/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  @ApiOperation({ summary: 'Get a boost order owned by the current landlord' })
  getOrder(@CurrentUser() user: JwtPayload, @Param('id') orderId: string) {
    return this.boostService.getOrder(user.sub, orderId);
  }
}
