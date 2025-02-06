import { Module } from '@nestjs/common';
import { LanguageProgrammingService } from './language-programming.service';
import { LanguageProgrammingController } from './language-programming.controller';

@Module({
  controllers: [LanguageProgrammingController],
  providers: [LanguageProgrammingService],
})
export class LanguageProgrammingModule {}
