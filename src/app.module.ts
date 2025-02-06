import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { StudentAuthModule } from './modules/student-auth/student-auth.module';
import { StudentModule } from './modules/student/student.module';
import { ProviderModule } from './providers/provider.module';
import { UserAuthModule } from './modules/user-auth/user-auth.module';
import { UserModule } from './modules/user/user.module';
import { SchoolModule } from './modules/school/school.module';
import { InternshipPositionModule } from './modules/internship-position/internship-position.module';
import { ExamSetModule } from './modules/exam-set/exam-set.module';
import { QuestionModule } from './modules/question/question.module';
import { LanguageProgrammingModule } from './modules/language-programming/language-programming.module';
import { InternshipProjectModule } from './modules/internship-project/internship-project.module';
import { ExamAttemptModule } from './modules/exam-attempt/exam-attempt.module';
import { InternshipApplicationModule } from './modules/internship-application/internship-application.module';
import { InternshipGroupModule } from './modules/internship-group/internship-group.module';
import { InternshipGroupsProjectModule } from './modules/internship-groups-project/internship-groups-project.module';
import { InternshipStudentGroupTaskManagementModule } from './modules/internship-student-group-task-management/internship-student-group-task-management.module';
import { InternshipStudentApplicationModule } from './modules/internship-student-application/internship-student-application.module';
import { StudentExamAttemptHistoryModule } from './modules/student-exam-attempt-history/student-exam-attempt-history.module';
import { SchoolAdminAuthModule } from './modules/school-admin-auth/school-admin-auth.module';
import { SchoolAdminModule } from './modules/school-admin/school-admin.module';
import { SchoolPublicModule } from './modules/school-public/school-public.module';
import { InternshipProjectPublicModule } from './modules/internship-project-public/internship-project-public.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SmsSocketCoreModule } from './modules/sms-socket-core/sms-socket-core.module';
import { SmsApiCoreModule } from './modules/sms-api-core/sms-api-core.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    StudentAuthModule,
    StudentModule,
    ProviderModule,
    UserAuthModule,
    UserModule,
    SchoolModule,
    InternshipPositionModule,
    ExamSetModule,
    QuestionModule,
    LanguageProgrammingModule,
    InternshipProjectModule,
    ExamAttemptModule,
    InternshipApplicationModule,
    InternshipGroupModule,
    InternshipGroupsProjectModule,
    InternshipStudentGroupTaskManagementModule,
    InternshipStudentApplicationModule,
    StudentExamAttemptHistoryModule,
    SchoolAdminAuthModule,
    SchoolAdminModule,
    SchoolPublicModule,
    InternshipProjectPublicModule,
    DashboardModule,
    SmsSocketCoreModule,
    SmsApiCoreModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
