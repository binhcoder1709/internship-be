import { Module } from '@nestjs/common';
import { InternshipPositionService } from './internship-position.service';
import { InternshipPositionController } from './internship-position.controller';

@Module({
  controllers: [InternshipPositionController],
  providers: [InternshipPositionService],
})
export class InternshipPositionModule {}
