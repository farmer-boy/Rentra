import { PartialType } from '@nestjs/swagger';
import { CreateLandlordProfileDto } from './create-landlord-profile.dto';

export class UpdateLandlordProfileDto extends PartialType(CreateLandlordProfileDto) {}
