import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InternshipApplicationProgress } from '@prisma/client';

export class StudentApplicationFilterDto {
    @ApiProperty({ required: false })
    @IsOptional()
    page?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    limit?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, enum: InternshipApplicationProgress })
    @IsOptional()
    @IsEnum(InternshipApplicationProgress)
    progress?: InternshipApplicationProgress;

    @ApiProperty({ required: false, enum: ['FULL_TIME', 'PART_TIME'] })
    @IsOptional()
    @IsEnum(['FULL_TIME', 'PART_TIME'])
    type?: 'FULL_TIME' | 'PART_TIME';
}
