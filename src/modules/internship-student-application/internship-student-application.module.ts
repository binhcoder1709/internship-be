import { Module } from '@nestjs/common';
import { InternshipStudentApplicationService } from './internship-student-application.service';
import { InternshipStudentApplicationController } from './internship-student-application.controller';

@Module({
  controllers: [InternshipStudentApplicationController],
  providers: [InternshipStudentApplicationService],
})
export class InternshipStudentApplicationModule {}
