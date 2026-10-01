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
import { ResoluteDisputeDto } from './dto/resolute-dispute.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User Management Endpoints
  @Get('users')
  @ApiOperation({ summary: 'Get all users with filters' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getAllUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers({ role, status, search });
  }

  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a user account' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  async suspendUser(
    @Param('id') userId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.suspendUser(userId, reason);
  }

  @Post('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsuspend a user account' })
  @ApiResponse({ status: 200, description: 'User unsuspended successfully' })
  async unsuspendUser(@Param('id') userId: string) {
    return this.adminService.unsuspendUser(userId);
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
  async getAllLandlordProfiles() {
    return this.adminService.getAllLandlordProfiles();
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
  async getAllListings(
    @Query('status') status?: string,
    @Query('city') city?: string,
  ) {
    return this.adminService.getAllListings({ status, city });
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
    @Body('reason') reason: string,
  ) {
    return this.adminService.flagListing(listingId, reason);
  }

  // Dispute Management Endpoints
  @Get('disputes')
  @ApiOperation({ summary: 'Get all disputes' })
  @ApiResponse({ status: 200, description: 'List of disputes' })
  async getAllDisputes(@Query('status') status?: string) {
    return this.adminService.getAllDisputes({ status });
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  async resolveDispute(
    @Param('id') disputeId: string,
    @Body() resolutionData: ResoluteDisputeDto,
  ) {
    return this.adminService.resolveDispute(disputeId, resolutionData);
  }

  @Patch('disputes/:id/close')
  @ApiOperation({ summary: 'Close a dispute' })
  @ApiResponse({ status: 200, description: 'Dispute closed successfully' })
  async closeDispute(@Param('id') disputeId: string) {
    return this.adminService.closeDispute(disputeId);
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
