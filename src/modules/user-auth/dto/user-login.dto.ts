import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class UserLoginDto {
    @ApiProperty({
        description: 'Email đăng nhập',
        example: 'mentor@example.com'
    })
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    email: string;

    @ApiProperty({
        description: 'Mật khẩu đăng nhập',
        example: '123456'
    })
    @IsString()
    @MinLength(3, { message: 'Mật khẩu phải có ít nhất 3 ký tự' })
    password: string;
} 