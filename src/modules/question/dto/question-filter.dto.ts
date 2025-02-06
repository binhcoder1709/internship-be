import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { QuestionType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class QuestionFilterDto {
    @ApiPropertyOptional({ description: 'Số trang' })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Số lượng mỗi trang' })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: QuestionType, description: 'Loại câu hỏi' })
    @IsOptional()
    @IsEnum(QuestionType)
    type?: QuestionType;

    @ApiPropertyOptional({ description: 'ID của exam set muốn loại trừ' })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    excludeExamSetId?: number;
} 