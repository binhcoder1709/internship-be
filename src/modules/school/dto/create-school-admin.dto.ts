import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateSchoolAdminDto {
    @ApiProperty({
        description: 'Email của admin trường học',
        example: 'admin@school.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Họ tên đầy đủ',
        example: 'Nguyễn Văn A'
    })
    @IsString()
    fullName: string;

    @ApiProperty({
        description: 'Số điện thoại',
        example: '0123456789',
        required: false
    })
    @IsOptional()
    @IsString()
    phoneNumber?: string;
} 