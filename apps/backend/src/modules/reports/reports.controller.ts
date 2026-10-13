import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignReportDto, ModerateReportDto, ResolveReportDto } from './dto/moderate-report.dto';
import { ModerationActionDto } from './dto/moderation-action.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';
import { InvestigationNoteDto } from '../audit/dto/investigation-note.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReportDto,
  ) {
    return this.reports.create(user.sub, dto);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
  ) {
    return this.reports.getMine(user.sub, query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reports.getById(
      id,
      user.sub,
      user.roles.includes('ADMIN'),
    );
  }
}

@ApiTags('admin-reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  list(@Query() query: ReportQueryDto) {
    return this.reports.listForAdmin(query);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reports.getById(id, user.sub, true);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AssignReportDto,
  ) {
    return this.reports.assign(id, user.sub, dto.adminId);
  }

  @Post(':id/resolve')
  resolve(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reports.resolve(id, user.sub, dto);
  }

  @Post(':id/notes')
  recordNote(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: InvestigationNoteDto,
  ) {
    return this.reports.recordInvestigationNote(id, user.sub, dto.note);
  }

  @Post(':id/request-information')
  requestInformation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: InvestigationNoteDto,
  ) {
    return this.reports.recordInvestigationNote(
      id,
      user.sub,
      dto.note,
      true,
    );
  }

  @Post(':id/suspend-user')
  suspendUser(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerationActionDto,
  ) {
    return this.reports.suspendReportedUser(id, user.sub, dto.reason);
  }

  @Post(':id/remove-listing')
  removeListing(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerationActionDto,
  ) {
    return this.reports.removeReportedListing(id, user.sub, dto.reason);
  }

  @Post(':id/restore-listing')
  restoreListing(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerationActionDto,
  ) {
    return this.reports.restoreReportedListing(id, user.sub, dto.reason);
  }

  @Post(':id/reinstate-user')
  reinstateUser(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerationActionDto,
  ) {
    return this.reports.reinstateReportedUser(id, user.sub, dto.reason);
  }

  @Patch(':id/status')
  moderate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerateReportDto,
  ) {
    return this.reports.moderate(id, user.sub, dto);
  }
}
