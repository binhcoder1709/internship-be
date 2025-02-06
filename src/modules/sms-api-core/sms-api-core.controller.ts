import { Controller, Post, Body } from '@nestjs/common';
import { SmsApiCoreService } from './sms-api-core.service';
import { SmsSocketCoreGateway } from '../sms-socket-core/sms-socket-core.gateway';
import { ApiOperation, ApiBody } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

class SendSmsDto {
  @IsNotEmpty()
  phoneNumber: string;
  @IsNotEmpty()
  message: string;
}

@Controller('sms-api-core')
export class SmsApiCoreController {
  constructor(
    private readonly smsApiCoreService: SmsApiCoreService,
    private readonly smsSocketGateway: SmsSocketCoreGateway
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Gửi tin nhắn SMS' })
  @ApiBody({ 
    type: SendSmsDto,
    description: 'Thông tin tin nhắn cần gửi' 
  })
  async sendSms(@Body() data: SendSmsDto) {
    console.log(data);
    // Emit tới tất cả clients đang kết nối
    await this.smsSocketGateway.broadcastMessage('send-sms', {
      phoneNumber: data.phoneNumber,
      message: data.message
    });

    return {
      success: true,
      message: 'Đã gửi tin nhắn thành công'
    };
  }
}
