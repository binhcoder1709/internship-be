import { Module } from '@nestjs/common';
import { ExamSetService } from './exam-set.service';
import { ExamSetController } from './exam-set.controller';

@Module({
  controllers: [ExamSetController],
  providers: [ExamSetService],
})
export class ExamSetModule {}
