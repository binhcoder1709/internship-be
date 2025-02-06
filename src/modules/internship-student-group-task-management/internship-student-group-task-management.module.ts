import { Module } from '@nestjs/common';
import { InternshipStudentGroupTaskManagementService } from './internship-student-group-task-management.service';
import { InternshipStudentGroupTaskManagementController } from './internship-student-group-task-management.controller';
import { InternshipGroupsProjectService } from '../internship-groups-project/internship-groups-project.service';

@Module({
  controllers: [InternshipStudentGroupTaskManagementController],
  providers: [InternshipStudentGroupTaskManagementService, InternshipGroupsProjectService],
})
export class InternshipStudentGroupTaskManagementModule {}
