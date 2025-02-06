import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { SchoolAdminStatus } from '@prisma/client';

export class UpdateSchoolAdminDto {
    @ApiProperty({
        description: 'Họ tên đầy đủ',
        example: 'Nguyễn Văn A',
        required: false
    })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({
        description: 'Số điện thoại',
        example: '0123456789',
        required: false
    })
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiProperty({
        description: 'Trạng thái tài khoản',
        enum: SchoolAdminStatus,
        required: false
    })
    @IsOptional()
    @IsEnum(SchoolAdminStatus)
    status?: SchoolAdminStatus;
} 