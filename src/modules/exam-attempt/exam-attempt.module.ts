import { Module } from '@nestjs/common';
import { ExamAttemptService } from './exam-attempt.service';
import { ExamAttemptGateway } from './exam-attempt.gateway';
import { ExamAttemptController } from './exam-attempt.controller';

@Module({
  imports: [
    
  ],
  controllers: [
    ExamAttemptController
  ],
  providers: [ExamAttemptGateway, ExamAttemptService],
})
export class ExamAttemptModule {}
