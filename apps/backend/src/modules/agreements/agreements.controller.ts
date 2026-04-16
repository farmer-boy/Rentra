import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AgreementsService } from './agreements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('agreements')
@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createAgreement(
    @Body()
    body: {
      tenantId: string;
      landlordId: string;
      listingId: string;
      rent: number;
      deposit: number;
      startDate: string;
      endDate: string;
    },
  ) {
    const agreement = await this.agreementsService.create(
      body.tenantId,
      body.landlordId,
      body.listingId,
      body.rent,
      body.deposit,
      body.startDate,
      body.endDate,
    );
    return {
      message: 'Agreement create ho gaya',
      data: agreement,
    };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAllAgreements() {
    const agreements = await this.agreementsService.findAll();
    return {
      message: 'Tamam agreements',
      data: agreements,
      count: agreements.length,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAgreementById(@Param('id') id: string) {
    const agreement = await this.agreementsService.findById(id);
    return {
      message: 'Agreement details',
      data: agreement,
    };
  }

  @Patch(':id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async approveAgreement(@Param('id') id: string) {
    const agreement = await this.agreementsService.approve(id);
    return {
      message: 'Agreement approve ho gaya',
      data: agreement,
    };
  }

  @Patch(':id/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async rejectAgreement(@Param('id') id: string) {
    const agreement = await this.agreementsService.reject(id);
    return {
      message: 'Agreement reject kar diya',
      data: agreement,
    };
  }

  @Patch(':id/terminate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async terminateAgreement(@Param('id') id: string) {
    const agreement = await this.agreementsService.terminate(id);
    return {
      message: 'Agreement terminate kar diya',
      data: agreement,
    };
  }
}
