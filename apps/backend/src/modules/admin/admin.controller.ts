import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DisputesService } from '../disputes/disputes.service';
import { DisputeQueryDto } from '../disputes/dto/dispute-query.dto';
import {
  ModerateDisputeDto,
  AssignDisputeDto,
} from '../disputes/dto/moderate-dispute.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { ModerationActionDto } from '../reports/dto/moderation-action.dto';
import { InvestigationNoteDto } from '../audit/dto/investigation-note.dto';
import { AdminListQueryDto } from './dto/admin-list-query.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly disputesService: DisputesService,
  ) {}

  // User Management Endpoints
  @Get('users')
  @ApiOperation({ summary: 'Get all users with filters' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getAllUsers(@Query() query: AdminListQueryDto) {
    return this.adminService.getAllUsers(query);
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a user account' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  async suspendUser(
    @Param('id') userId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerationActionDto,
  ) {
    return this.adminService.suspendUser(userId, user.sub, dto.reason);
  }

  @Post('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsuspend a user account' })
  @ApiResponse({ status: 200, description: 'User unsuspended successfully' })
  async unsuspendUser(
    @Param('id') userId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerationActionDto,
  ) {
    return this.adminService.unsuspendUser(userId, user.sub, dto.reason);
  }

  @Post('users/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a user account' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  async verifyUser(@Param('id') userId: string) {
    return this.adminService.verifyUser(userId);
  }

  @Get('landlord-profiles')
  @ApiOperation({ summary: 'Get all landlord profiles' })
  @ApiResponse({ status: 200, description: 'List of landlord profiles' })
  async getAllLandlordProfiles(@Query() query: AdminListQueryDto) {
    return this.adminService.getAllLandlordProfiles(query);
  }

  @Patch('landlord-profiles/:id/verify')
  @ApiOperation({ summary: 'Verify a landlord profile' })
  @ApiResponse({ status: 200, description: 'Landlord profile verified' })
  async verifyLandlordProfile(@Param('id') profileId: string) {
    return this.adminService.verifyLandlordProfile(profileId);
  }

  // Listing Management Endpoints
  @Get('listings')
  @ApiOperation({ summary: 'Get all listings' })
  @ApiResponse({ status: 200, description: 'List of listings' })
  async getAllListings(@Query() query: AdminListQueryDto) {
    return this.adminService.getAllListings(query);
  }

  @Get('properties')
  async getProperties(@Query() query: AdminListQueryDto) {
    return this.adminService.getProperties(query);
  }

  @Get('bookings')
  async getBookings(@Query() query: AdminListQueryDto) {
    return this.adminService.getBookings(query);
  }

  @Get('rental-requests')
  async getRentalRequests(@Query() query: AdminListQueryDto) {
    return this.adminService.getRentalRequests(query);
  }

  @Get('agreements')
  async getAgreements(@Query() query: AdminListQueryDto) {
    return this.adminService.getAgreements(query);
  }

  @Get('payments')
  async getPayments(@Query() query: AdminListQueryDto) {
    return this.adminService.getPayments(query);
  }

  @Get('reviews')
  async getReviews(@Query() query: AdminListQueryDto) {
    return this.adminService.getReviews(query);
  }

  @Get('audit-events')
  async getAuditEvents(@Query() query: AdminListQueryDto) {
    return this.adminService.getAuditEvents(query);
  }

  @Get('notifications')
  async getNotifications(@Query() query: AdminListQueryDto) {
    return this.adminService.getNotifications(query);
  }

  @Patch('listings/:id/verify')
  @ApiOperation({ summary: 'Verify a listing' })
  @ApiResponse({ status: 200, description: 'Listing verified successfully' })
  async verifyListing(@Param('id') listingId: string) {
    return this.adminService.verifyListing(listingId);
  }

  @Patch('listings/:id/flag')
  @ApiOperation({ summary: 'Flag a listing as fraudulent' })
  @ApiResponse({ status: 200, description: 'Listing flagged successfully' })
  async flagListing(
    @Param('id') listingId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerationActionDto,
  ) {
    return this.adminService.flagListing(listingId, user.sub, dto.reason);
  }

  // Dispute Management Endpoints
  @Get('disputes')
  @ApiOperation({ summary: 'Get all disputes' })
  @ApiResponse({ status: 200, description: 'List of disputes' })
  async getAllDisputes(@Query() query: DisputeQueryDto) {
    return this.disputesService.listForAdmin(query);
  }

  @Get('disputes/:id')
  getDisputeById(
    @Param('id') disputeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.disputesService.getById(disputeId, user.sub, true);
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  async resolveDispute(
    @Param('id') disputeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() resolutionData: ResolveDisputeDto,
  ) {
    return this.disputesService.resolve(
      disputeId,
      user.sub,
      resolutionData.resolution,
    );
  }

  @Post('disputes/:id/resolve')
  resolveDisputePost(
    @Param('id') disputeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() resolutionData: ResolveDisputeDto,
  ) {
    return this.disputesService.resolve(
      disputeId,
      user.sub,
      resolutionData.resolution,
    );
  }

  @Patch('disputes/:id/status')
  moderateDispute(
    @Param('id') disputeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerateDisputeDto,
  ) {
    return this.disputesService.moderate(disputeId, user.sub, dto);
  }

  @Post('disputes/:id/assign')
  assignDispute(
    @Param('id') disputeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AssignDisputeDto,
  ) {
    return this.disputesService.assign(disputeId, user.sub, dto.adminId);
  }

  @Post('disputes/:id/notes')
  recordDisputeNote(
    @Param('id') disputeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: InvestigationNoteDto,
  ) {
    return this.disputesService.recordInvestigationNote(
      disputeId,
      user.sub,
      dto.note,
    );
  }

  @Post('disputes/:id/request-information')
  requestDisputeInformation(
    @Param('id') disputeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: InvestigationNoteDto,
  ) {
    return this.disputesService.recordInvestigationNote(
      disputeId,
      user.sub,
      dto.note,
      true,
    );
  }

  @Patch('disputes/:id/close')
  @ApiOperation({ summary: 'Close a dispute' })
  @ApiResponse({ status: 200, description: 'Dispute closed successfully' })
  async closeDispute(
    @Param('id') disputeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() resolutionData: ResolveDisputeDto,
  ) {
    return this.disputesService.close(
      disputeId,
      user.sub,
      resolutionData.resolution,
    );
  }

  // Dashboard Endpoints
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/activity')
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiResponse({ status: 200, description: 'Recent activity' })
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }
}
