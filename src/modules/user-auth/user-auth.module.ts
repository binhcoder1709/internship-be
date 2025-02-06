import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [UserAuthController],
  providers: [UserAuthService],
})
export class UserAuthModule {}
