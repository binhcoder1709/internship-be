import { Module } from '@nestjs/common';
import { SchoolPublicService } from './school-public.service';
import { SchoolPublicController } from './school-public.controller';

@Module({
  controllers: [SchoolPublicController],
  providers: [SchoolPublicService],
})
export class SchoolPublicModule {}
