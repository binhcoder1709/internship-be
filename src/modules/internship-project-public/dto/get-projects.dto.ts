import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProjectsDto {
    @ApiProperty({
        description: 'Trang hiện tại',
        example: 1,
        required: false
    })
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiProperty({
        description: 'Số lượng item trên một trang',
        example: 10,
        required: false
    })
    @IsOptional()
    @Type(() => Number)
    limit?: number;

    @ApiProperty({
        description: 'Từ khóa tìm kiếm (tìm theo tên hoặc mô tả)',
        example: 'web app',
        required: false
    })
    @IsOptional()
    @IsString()
    search?: string;
} 