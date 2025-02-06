import { Module } from '@nestjs/common';
import { SmsSocketCoreService } from './sms-socket-core.service';
import { SmsSocketCoreGateway } from './sms-socket-core.gateway';

@Module({
  providers: [SmsSocketCoreGateway, SmsSocketCoreService],
})
export class SmsSocketCoreModule {}
