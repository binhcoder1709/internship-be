import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export enum InterviewResult {
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED'
}

export class UpdateInterviewResponseDto {
    @ApiProperty({
        description: 'Ghi chú phản hồi phỏng vấn',
        example: 'Tôi đã sẵn sàng'
    })
    @IsString()
    interviewStudentResponseNote: string;

    @ApiProperty({
        description: 'Kết quả phản hồi phỏng vấn',
        enum: InterviewResult,
        example: InterviewResult.ACCEPTED
    })
    @IsEnum(InterviewResult)
    interviewStudentResponseResult: InterviewResult;
} 