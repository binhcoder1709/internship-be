import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ExamSetType } from '@prisma/client';

export class GetExamAttemptHistoryDto {
    @ApiProperty({
        description: 'Trang hiện tại',
        required: false,
        default: 1
    })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    page?: number;

    @ApiProperty({
        description: 'Số lượng kết quả mỗi trang',
        required: false,
        default: 10
    })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    limit?: number;

    @ApiProperty({
        description: 'Tìm kiếm theo tên bộ đề',
        required: false
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'Lọc theo loại bộ đề',
        required: false,
        enum: ExamSetType
    })
    @IsOptional()
    @IsEnum(ExamSetType)
    examSetType?: ExamSetType;

    @ApiProperty({
        description: 'Sắp xếp theo thời gian bắt đầu (asc/desc)',
        required: false,
        default: 'desc'
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    sort?: 'asc' | 'desc' = 'desc';
} 