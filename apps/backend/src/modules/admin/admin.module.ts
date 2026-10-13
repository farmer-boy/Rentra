import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DisputesModule } from '../disputes/disputes.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, DisputesModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
