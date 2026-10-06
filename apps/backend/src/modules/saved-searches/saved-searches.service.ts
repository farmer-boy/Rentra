import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { SavedSearchFiltersDto } from './dto/saved-search-filters.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSavedSearchDto) {
    if (!dto.name.trim()) {
      throw new BadRequestException('Saved search name cannot be empty');
    }
    this.validateFilters(dto.filters);
    return this.prisma.savedSearch.create({
      data: {
        userId,
        name: dto.name.trim(),
        filtersJson: this.toJson(dto.filters),
      },
      select: { id: true, name: true, filtersJson: true, createdAt: true },
    });
  }

  list(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, filtersJson: true, createdAt: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateSavedSearchDto) {
    if (dto.name === undefined && dto.filters === undefined) {
      throw new BadRequestException('Provide a name or filters to update');
    }
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Saved search name cannot be empty');
    }
    if (dto.filters) this.validateFilters(dto.filters);

    const result = await this.prisma.savedSearch.updateMany({
      where: { id, userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.filters !== undefined && {
          filtersJson: this.toJson(dto.filters),
        }),
      },
    });
    if (result.count === 0)
      throw new NotFoundException('Saved search not found');

    return this.prisma.savedSearch.findFirstOrThrow({
      where: { id, userId },
      select: { id: true, name: true, filtersJson: true, createdAt: true },
    });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.savedSearch.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0)
      throw new NotFoundException('Saved search not found');
    return { id, deleted: true };
  }

  private validateFilters(filters: SavedSearchFiltersDto) {
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }
    const hasLatitude = filters.latitude !== undefined;
    const hasLongitude = filters.longitude !== undefined;
    const hasRadius = filters.radiusKm !== undefined;
    if (hasLatitude !== hasLongitude || hasLatitude !== hasRadius) {
      throw new BadRequestException(
        'Nearby filters require latitude, longitude, and radiusKm together',
      );
    }
  }

  private toJson(filters: SavedSearchFiltersDto): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(filters)) as Prisma.InputJsonValue;
  }
}
