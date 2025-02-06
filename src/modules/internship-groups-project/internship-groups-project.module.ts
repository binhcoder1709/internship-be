import { Module } from '@nestjs/common';
import { InternshipGroupsProjectService } from './internship-groups-project.service';
import { InternshipGroupsProjectController } from './internship-groups-project.controller';
import { InternshipGroupService } from '../internship-group/internship-group.service';

@Module({
  controllers: [InternshipGroupsProjectController],
  providers: [InternshipGroupsProjectService, InternshipGroupService],
})
export class InternshipGroupsProjectModule {}
