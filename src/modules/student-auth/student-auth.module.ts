import { Module } from '@nestjs/common';
import { StudentAuthService } from './student-auth.service';
import { StudentAuthController } from './student-auth.controller';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [StudentModule],
  controllers: [StudentAuthController],
  providers: [StudentAuthService]
})
export class StudentAuthModule {}
