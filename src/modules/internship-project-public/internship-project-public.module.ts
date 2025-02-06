import { Module } from '@nestjs/common';
import { InternshipProjectPublicService } from './internship-project-public.service';
import { InternshipProjectPublicController } from './internship-project-public.controller';

@Module({
  controllers: [InternshipProjectPublicController],
  providers: [InternshipProjectPublicService],
})
export class InternshipProjectPublicModule {}
