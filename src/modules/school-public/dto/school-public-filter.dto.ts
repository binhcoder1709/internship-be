import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SchoolPublicFilterDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    page?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    limit?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;
} 