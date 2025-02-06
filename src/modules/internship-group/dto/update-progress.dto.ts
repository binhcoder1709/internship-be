import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InternshipGroupProgress } from '@prisma/client';

export class UpdateProgressDto {
    @ApiProperty({ 
        enum: ['WAITING_FOR_MENTOR', 'WAITING_FOR_STUDENT', 'WAITING_FOR_PROJECT'],
        description: `Trạng thái mới của nhóm (chỉ cho phép 3 trạng thái):
        - WAITING_FOR_MENTOR: Chờ mentor
        - WAITING_FOR_STUDENT: Chờ sinh viên
        - WAITING_FOR_PROJECT: Chờ dự án`
    })
    @IsEnum(InternshipGroupProgress, {
        message: 'Trạng thái không hợp lệ'
    })
    progress: InternshipGroupProgress;
} 