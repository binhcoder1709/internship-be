import { Module } from '@nestjs/common';
import { InternshipGroupService } from './internship-group.service';
import { InternshipGroupController } from './internship-group.controller';

@Module({
  controllers: [InternshipGroupController],
  providers: [InternshipGroupService],
})
export class InternshipGroupModule {}
