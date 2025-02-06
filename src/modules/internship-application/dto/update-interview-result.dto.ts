import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InternshipApplicationInterviewResult } from '@prisma/client';

export class UpdateInterviewResultDto {
    @ApiProperty({
        enum: ['PASSED', 'FAILED', 'CANCELED'],
        description: 'Kết quả phỏng vấn'
    })
    @IsEnum(InternshipApplicationInterviewResult)
    interviewResult: InternshipApplicationInterviewResult;

    @ApiProperty({
        required: false,
        description: 'Ghi chú kết quả phỏng vấn'
    })
    @IsOptional()
    @IsString()
    interviewResultNote?: string;
} 