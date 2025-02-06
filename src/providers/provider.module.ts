import { Global, Module } from '@nestjs/common';
import { JwtProvider } from './local/jwt.provider';
import { GmailProvider } from './external/gmail.provider';
import { RedisProvider } from './local/redis.provider';
import { PrismaProvider } from './local/prisma.provider';
import { Judge0Provider } from './external/judge0.provider';
import { GoogleSheetsProvider } from './external/google-sheets.provider';
import { SmsProvider } from './external/sms.provider';


@Global()
@Module({
  providers: [
    JwtProvider,
    GmailProvider, 
    RedisProvider, 
    PrismaProvider,
    Judge0Provider,
    GoogleSheetsProvider,
    SmsProvider
  ],
  exports: [
    JwtProvider, 
    GmailProvider, 
    RedisProvider, 
    PrismaProvider,
    Judge0Provider,
    GoogleSheetsProvider,
    SmsProvider
  ],
})
export class ProviderModule {}

