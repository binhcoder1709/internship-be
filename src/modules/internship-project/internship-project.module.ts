import { Module } from '@nestjs/common';
import { InternshipProjectService } from './internship-project.service';
import { InternshipProjectController } from './internship-project.controller';

@Module({
  controllers: [InternshipProjectController],
  providers: [InternshipProjectService],
})
export class InternshipProjectModule {}
