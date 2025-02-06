import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, IsBoolean, IsString } from 'class-validator';
import { InterviewTrainingTaskStatus, InterviewTrainingTaskType } from '@prisma/client';

export class UpdateTrainingTaskDto {
    @ApiProperty({
        description: 'Trạng thái hoàn thành task',
        enum: InterviewTrainingTaskStatus,
        required: false
    })
    @IsOptional()
    @IsEnum(InterviewTrainingTaskStatus)
    status?: InterviewTrainingTaskStatus;

    @ApiProperty({
        description: 'Loại training task',
        enum: InterviewTrainingTaskType,
        required: false
    })
    @IsOptional()
    @IsEnum(InterviewTrainingTaskType)
    type?: InterviewTrainingTaskType;

    @ApiProperty({
        description: 'ID của bộ đề thi',
        required: false
    })
    @IsOptional()
    @IsNumber()
    examSetId?: number;

    @ApiProperty({
        description: 'ID của bài làm',
        required: false
    })
    @IsOptional()
    @IsNumber()
    examAttemptId?: number;

    @ApiProperty({
        description: 'Trạng thái nộp trễ',
        required: false
    })
    @IsOptional()
    @IsBoolean()
    isLate?: boolean;

    @ApiProperty({
        description: 'Nhận xét của giảng viên',
        required: false
    })
    @IsOptional()
    @IsString()
    lectureComment?: string;
} 