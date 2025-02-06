import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SchoolAdminLoginDto {
    @ApiProperty({
        description: 'Email đăng nhập',
        example: 'admin@school.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Mật khẩu',
        example: 'password123'
    })
    @IsString()
    @MinLength(6)
    password: string;
} 