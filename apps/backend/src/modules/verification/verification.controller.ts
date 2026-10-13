import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePropertyVerificationDto } from './dto/create-property-verification.dto';
import { CreateVerificationSubmissionDto } from './dto/create-verification-submission.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { RevokeVerificationDto } from './dto/revoke-verification.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { VerificationService } from './verification.service';

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('phone/send')
  @ApiOperation({ summary: 'Send a one-time code to the authenticated phone' })
  sendPhoneCode(@CurrentUser() user: JwtPayload) {
    return this.verificationService.sendPhoneCode(user.sub);
  }

  @Post('phone/confirm')
  @ApiOperation({ summary: 'Confirm the phone verification code' })
  verifyPhone(@CurrentUser() user: JwtPayload, @Body() dto: VerifyPhoneDto) {
    return this.verificationService.verifyPhone(user.sub, dto.code);
  }

  @Post('submissions')
  @ApiOperation({ summary: 'Submit identity or host evidence for review' })
  submitUserVerification(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVerificationSubmissionDto,
  ) {
    return this.verificationService.submitUserVerification(user.sub, dto);
  }

  @Post('properties/:id')
  @ApiOperation({ summary: 'Submit an owned property for verification' })
  submitPropertyVerification(
    @Param('id') propertyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePropertyVerificationDto,
  ) {
    return this.verificationService.submitPropertyVerification(
      user.sub,
      propertyId,
      dto,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user verification statuses' })
  getMySubmissions(@CurrentUser() user: JwtPayload) {
    return this.verificationService.getMySubmissions(user.sub);
  }

  @Get('admin/submissions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List pending verification submissions (admin)' })
  listPendingSubmissions() {
    return this.verificationService.listPendingSubmissions();
  }

  @Get('admin/submissions/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Review submitted identity details and evidence (admin only)',
  })
  getSubmissionForAdmin(@Param('id') id: string) {
    return this.verificationService.getSubmissionForAdmin(id);
  }

  @Patch('admin/submissions/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve or reject a verification submission' })
  reviewSubmission(
    @Param('id') id: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.verificationService.reviewSubmission(admin.sub, id, dto);
  }

  @Post('admin/submissions/:id/revoke')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Revoke an approved verification submission' })
  revokeSubmission(
    @Param('id') id: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: RevokeVerificationDto,
  ) {
    return this.verificationService.revokeSubmission(admin.sub, id, dto);
  }
}
