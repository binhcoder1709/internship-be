import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AccountGender, StudentStatus } from '@prisma/client';

export class StudentFilterDto {
    @ApiProperty({ required: false })
    @IsOptional()
    page?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    limit?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    schoolId?: number;

    @ApiProperty({ enum: StudentStatus, required: false })
    @IsEnum(StudentStatus)
    @IsOptional()
    status?: StudentStatus;

    @ApiProperty({ enum: AccountGender, required: false })
    @IsEnum(AccountGender)
    @IsOptional()
    gender?: AccountGender;
} 