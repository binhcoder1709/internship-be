import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { InterviewTrainingTaskType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTrainingTaskDto {
    @ApiProperty({
        description: 'ID của task chính',
        example: 1
    })
    @IsNumber()
    @Type(() => Number)
    internshipGroupTaskId: number;

    @ApiProperty({
        description: 'Loại task training',
        enum: InterviewTrainingTaskType,
        example: InterviewTrainingTaskType.MORNING_QUIZZ
    })
    @IsEnum(InterviewTrainingTaskType)
    type: InterviewTrainingTaskType;

    @ApiProperty({
        description: 'ID của bộ đề thi',
        example: 1
    })
    @IsNumber()
    @Type(() => Number)
    examSetId: number;

    @ApiProperty({
        description: 'ID của student',
        example: 1
    })
    @IsNumber()
    @Type(() => Number)
    studentId: number;
} 