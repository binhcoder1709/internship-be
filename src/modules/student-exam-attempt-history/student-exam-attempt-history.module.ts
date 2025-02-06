import { Module } from '@nestjs/common';
import { StudentExamAttemptHistoryService } from './student-exam-attempt-history.service';
import { StudentExamAttemptHistoryController } from './student-exam-attempt-history.controller';

@Module({
  controllers: [StudentExamAttemptHistoryController],
  providers: [StudentExamAttemptHistoryService],
})
export class StudentExamAttemptHistoryModule {}
