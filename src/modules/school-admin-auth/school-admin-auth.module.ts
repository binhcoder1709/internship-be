import { Module } from '@nestjs/common';
import { SchoolAdminAuthService } from './school-admin-auth.service';
import { SchoolAdminAuthController } from './school-admin-auth.controller';

@Module({
  controllers: [SchoolAdminAuthController],
  providers: [SchoolAdminAuthService],
})
export class SchoolAdminAuthModule {}
