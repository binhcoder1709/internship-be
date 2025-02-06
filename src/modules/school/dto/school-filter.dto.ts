import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SchoolFilterDto {
    @ApiProperty({
        description: 'Trang hiện tại',
        example: 1,
        required: false
    })
    @IsOptional()
    page?: number = 1;

    @ApiProperty({
        description: 'Số lượng item trên một trang',
        example: 10,
        required: false
    })
    @IsOptional()
    limit?: number = 10;

    @ApiProperty({
        description: 'Từ khóa tìm kiếm (tên trường hoặc địa chỉ)',
        example: 'Chu Van An',
        required: false
    })
    @IsOptional()
    @IsString()
    search?: string;
} 