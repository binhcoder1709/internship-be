import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
    @ApiProperty({
        description: 'Email đăng nhập',
        example: 'mentor@example.com'
    })
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    email: string;

    @ApiProperty({
        description: 'Mật khẩu',
        example: '123456'
    })
    @IsString()
    @MinLength(3, { message: 'Mật khẩu phải có ít nhất 3 ký tự' })
    password: string;

    @ApiProperty({
        description: 'Họ và tên',
        example: 'Nguyễn Văn A'
    })
    @IsString()
    fullName: string;

    @ApiProperty({
        description: 'Vai trò',
        enum: UserRole,
        example: 'LECTURE'
    })
    @IsEnum(UserRole)
    role: UserRole;
} 