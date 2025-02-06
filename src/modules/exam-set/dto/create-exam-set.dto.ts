import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExamSetType } from '@prisma/client';

export class CreateExamSetDto {
    @ApiProperty({ description: 'Tiêu đề bộ đề' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Mô tả bộ đề', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Thời gian làm bài (phút)', default: 20 })
    @IsOptional()
    @IsNumber()
    timeLimit?: number;

    @ApiProperty({ 
        description: 'Loại bộ đề', 
        enum: ExamSetType,
        default: ExamSetType.ONE_TIME 
    })
    @IsOptional()
    @IsEnum(ExamSetType)
    type?: ExamSetType;
} 