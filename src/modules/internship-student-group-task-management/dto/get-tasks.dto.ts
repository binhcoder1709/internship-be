import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { InternshipGroupTaskProgess } from '@prisma/client';

export class GetTasksDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: InternshipGroupTaskProgess })
    @IsOptional()
    @IsEnum(InternshipGroupTaskProgess)
    progress?: InternshipGroupTaskProgess;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    regulations?: string;
} 