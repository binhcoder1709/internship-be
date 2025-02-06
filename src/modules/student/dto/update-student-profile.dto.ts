import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { AccountGender } from '@prisma/client';

export class UpdateStudentProfileDto {
    @ApiProperty({ 
        description: 'Họ và tên học sinh',
        required: false 
    })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({ 
        description: 'Địa chỉ',
        required: false 
    })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ 
        description: 'Giới thiệu bản thân',
        required: false 
    })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiProperty({ 
        description: 'Giới tính',
        enum: AccountGender,
        required: false 
    })
    @IsOptional()
    @IsEnum(AccountGender)
    gender?: AccountGender;

    @ApiProperty({ 
        description: 'Ngày sinh (YYYY-MM-DD)',
        required: false 
    })
    @IsOptional()
    @IsDateString()
    birthday?: Date;
} 