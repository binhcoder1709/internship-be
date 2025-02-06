import { Module } from '@nestjs/common';
import { SchoolAdminService } from './school-admin.service';
import { SchoolAdminController } from './school-admin.controller';
import { DashboardService } from '../dashboard/dashboard.service';

@Module({
  controllers: [SchoolAdminController],
  providers: [
    SchoolAdminService,
    DashboardService
  ],
  exports: [SchoolAdminService]
})
export class SchoolAdminModule {}
