import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateExamAttemptDto {
    @ApiProperty({
        description: 'ID của bộ đề thi',
        example: 1
    })
    @IsNumber()
    examSetId: number;
} 