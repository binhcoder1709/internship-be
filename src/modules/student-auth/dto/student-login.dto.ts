import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class StudentLoginDto {
    @ApiProperty({
        example: 'student@example.com',
        description: 'Email đăng nhập'
    })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({
        example: '123456',
        description: 'Mật khẩu'
    })
    @IsString()
    @MinLength(3, { message: 'Mật khẩu phải có ít nhất 3 ký tự' })
    password: string;
} 