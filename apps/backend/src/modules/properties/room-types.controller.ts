import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { RoomTypesService } from './room-types.service';

@ApiTags('room-types')
@Controller('room-types')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update a room type and its units' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomTypesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a room type without active bookings' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roomTypesService.remove(id, user.sub);
  }
}
