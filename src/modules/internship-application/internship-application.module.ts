import { Module } from '@nestjs/common';
import { InternshipApplicationService } from './internship-application.service';
import { InternshipApplicationController } from './internship-application.controller';

@Module({
  controllers: [InternshipApplicationController],
  providers: [InternshipApplicationService],
})
export class InternshipApplicationModule {}
