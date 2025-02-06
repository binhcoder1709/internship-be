import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { InternshipGroupTaskProgess } from '@prisma/client';

export class GetTasksDto {
    @ApiProperty({
        description: 'Số trang',
        example: 1,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page?: number = 1;

    @ApiProperty({
        description: 'Số lượng item trên mỗi trang',
        example: 10,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit?: number = 10;

    @ApiProperty({
        description: 'Tìm kiếm theo tên task',
        example: 'UI Dashboard',
        required: false
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'Filter theo trạng thái task',
        enum: InternshipGroupTaskProgess,
        required: false
    })
    @IsOptional()
    @IsEnum(InternshipGroupTaskProgess)
    progress?: InternshipGroupTaskProgess;

    @ApiProperty({
        description: 'Filter theo regulations',
        example: 'VIOLATE',
        required: false
    })
    @IsOptional()
    @IsString()
    regulations?: string;
} 