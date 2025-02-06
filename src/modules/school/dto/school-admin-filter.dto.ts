import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SchoolAdminFilterDto {
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

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    schoolId?: string;
} 