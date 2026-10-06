import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { SavedSearchesService } from './saved-searches.service';

@ApiTags('saved-searches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Post()
  @ApiOperation({ summary: 'Save a named search and its filters' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSavedSearchDto) {
    return this.savedSearchesService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List the current user saved searches' })
  list(@CurrentUser() user: JwtPayload) {
    return this.savedSearchesService.list(user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saved search owned by the current user' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
  ) {
    return this.savedSearchesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved search owned by the current user' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.savedSearchesService.remove(user.sub, id);
  }
}
