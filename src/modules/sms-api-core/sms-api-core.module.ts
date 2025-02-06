import { Module } from '@nestjs/common';
import { SmsApiCoreController } from './sms-api-core.controller';
import { SmsApiCoreService } from './sms-api-core.service';
import { SmsSocketCoreGateway } from '../sms-socket-core/sms-socket-core.gateway';

@Module({
  controllers: [SmsApiCoreController],
  providers: [SmsApiCoreService, SmsSocketCoreGateway]
})
export class SmsApiCoreModule {}
