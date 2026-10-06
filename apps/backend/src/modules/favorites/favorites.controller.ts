import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.favoritesService.list(user.sub);
  }

  @Get(':listingId')
  has(@CurrentUser() user: JwtPayload, @Param('listingId') listingId: string) {
    return this.favoritesService.has(user.sub, listingId);
  }

  @Post(':listingId')
  add(@CurrentUser() user: JwtPayload, @Param('listingId') listingId: string) {
    return this.favoritesService.add(user.sub, listingId);
  }

  @Delete(':listingId')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.remove(user.sub, listingId);
  }
}
