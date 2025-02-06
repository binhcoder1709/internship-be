import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InternshipGroupProgress } from '@prisma/client';

export class StudentGroupsFilterDto {
    @ApiProperty({ 
        required: false,
        description: 'Số trang (mặc định: 1)'
    })
    @IsOptional()
    page?: number;

    @ApiProperty({ 
        required: false,
        description: 'Số lượng item trên một trang (mặc định: 10)'
    })
    @IsOptional()
    limit?: number;

    @ApiProperty({ 
        required: false,
        description: 'Tìm kiếm theo tên nhóm hoặc mô tả'
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ 
        required: false, 
        enum: InternshipGroupProgress,
        description: `Lọc theo trạng thái nhóm:
        - WAITING_FOR_MENTOR: Chờ mentor
        - WAITING_FOR_STUDENT: Chờ sinh viên
        - WAITING_FOR_PROJECT: Chờ dự án
        - START_PROJECT: Đang thực hiện
        - FINISH_PROJECT: Đã hoàn thành`
    })
    @IsOptional()
    @IsEnum(InternshipGroupProgress)
    progress?: InternshipGroupProgress;
} 