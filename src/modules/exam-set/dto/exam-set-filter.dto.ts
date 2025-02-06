import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ExamSetFilterDto {
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
} 