import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class InternshipProjectFilterDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    page?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    limit?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;
} 