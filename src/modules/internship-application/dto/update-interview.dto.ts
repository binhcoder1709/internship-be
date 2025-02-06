import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateInterviewDto {
    @ApiProperty({
        description: 'Link phỏng vấn (Google Meet, Zoom,...)',
        example: 'https://meet.google.com/abc-defg-hij'
    })
    @IsString()
    interviewLink: string;

    @ApiProperty({
        description: 'Thời gian phỏng vấn',
        example: '2024-03-20T09:00:00.000Z'
    })
    @IsDateString()
    interviewTime: Date;

    @ApiProperty({
        required: false,
        description: 'Ghi chú phỏng vấn',
        example: 'Chuẩn bị CV và portfolio'
    })
    @IsOptional()
    @IsString()
    interviewNote?: string;
} 