import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { AccountGender, StudentStatus } from '@prisma/client';

export class CreateStudentDto {
    @ApiProperty({ example: 'student@gmail.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '0123456789' })
    @IsPhoneNumber('VN')
    phoneNumber: string;

    @ApiProperty()
    @IsString()
    password: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    bio?: string;

    @ApiProperty({ enum: AccountGender, required: false })
    @IsEnum(AccountGender)
    @IsOptional()
    gender?: AccountGender;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    avatar?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    birthday?: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    schoolId?: number;

    @ApiProperty({ enum: StudentStatus, required: false })
    @IsEnum(StudentStatus)
    @IsOptional()
    status?: StudentStatus;
} 