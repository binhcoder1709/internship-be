import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InternshipApplicationProgress, InternshipApplicationType } from '@prisma/client';

export class InternshipApplicationFilterDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(InternshipApplicationProgress)
    progress?: InternshipApplicationProgress;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(InternshipApplicationType)
    type?: InternshipApplicationType;

    @ApiProperty({ required: false })
    @IsOptional()
    page?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    limit?: number;
} 