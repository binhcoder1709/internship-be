import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class SchoolStudentFilterDto {
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
} 