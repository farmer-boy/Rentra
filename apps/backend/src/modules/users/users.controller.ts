import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateLandlordProfileDto } from './dto/create-landlord-profile.dto';
import { UpdateLandlordProfileDto } from './dto/update-landlord-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('me/landlord-profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a landlord profile for the current user' })
  @ApiResponse({ status: 201, description: 'Landlord profile created' })
  @ApiResponse({ status: 409, description: 'Landlord profile already exists' })
  async createLandlordProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLandlordProfileDto,
  ) {
    const profile = await this.usersService.createLandlordProfile(user.sub, dto);
    return {
      message: 'Landlord profile created successfully',
      data: profile,
    };
  }

  @Get('me/landlord-profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the current user landlord profile' })
  @ApiResponse({ status: 200, description: 'Landlord profile retrieved' })
  async getLandlordProfile(@CurrentUser() user: JwtPayload) {
    const profile = await this.usersService.getLandlordProfile(user.sub);
    return {
      message: 'Landlord profile retrieved successfully',
      data: profile,
    };
  }

  @Patch('me/landlord-profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update the current user landlord profile' })
  @ApiResponse({ status: 200, description: 'Landlord profile updated' })
  async updateLandlordProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateLandlordProfileDto,
  ) {
    const profile = await this.usersService.updateLandlordProfile(user.sub, dto);
    return {
      message: 'Landlord profile updated successfully',
      data: profile,
    };
  }

  @Post()
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, type: UserResponseDto })
  async createUser(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return {
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return {
      message: 'Users list retrieved',
      data: users,
      count: users.length,
    };
  }

  @Get(':id')
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      message: 'User profile',
      data: user,
    };
  }

  @Put(':id')
  @ApiResponse({ status: 200, type: UserResponseDto })
  async replaceUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  @Patch(':id')
  @ApiResponse({ status: 200, type: UserResponseDto })
  async patchUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  @Patch(':id/trust-score')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateTrustScore(
    @Param('id') id: string,
    @Body() body: { score: number },
  ) {
    const user = await this.usersService.updateTrustScore(id, body.score);
    return {
      message: 'Trust score updated successfully',
      data: user,
    };
  }

  @Post(':id/suspend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: UserResponseDto })
  async suspendUser(@Param('id') id: string) {
    const user = await this.usersService.suspend(id);
    return {
      message: 'User suspended successfully',
      data: user,
    };
  }

  @Post(':id/unsuspend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: UserResponseDto })
  async unsuspendUser(@Param('id') id: string) {
    const user = await this.usersService.unsuspend(id);
    return {
      message: 'User unsuspended successfully',
      data: user,
    };
  }

  @Post(':id/verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: UserResponseDto })
  async verifyUser(@Param('id') id: string) {
    const user = await this.usersService.verify(id);
    return {
      message: 'User verified successfully',
      data: user,
    };
  }

  @Delete(':id')
  @ApiResponse({ status: 200, type: UserResponseDto })
  async deleteUser(@Param('id') id: string) {
    const user = await this.usersService.delete(id);
    return {
      message: 'User deleted successfully',
      data: user,
    };
  }
}
