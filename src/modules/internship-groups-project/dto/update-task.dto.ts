import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDate, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { InternshipGroupTaskProgess, internshipRegulations } from '@prisma/client';

export class UpdateTaskDto {
    @ApiProperty({ 
        description: 'Thời gian bắt đầu task',
        required: false,
        example: '2024-03-20T08:00:00Z'
    })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    startDate?: Date;

    @ApiProperty({ 
        description: 'Thời gian kết thúc task',
        required: false,
        example: '2024-03-20T17:00:00Z'
    })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    finishDate?: Date;

    @ApiProperty({ 
        description: 'Trạng thái task',
        enum: InternshipGroupTaskProgess,
        enumName: 'InternshipGroupTaskProgess',
        required: false,
        example: 'DONE_ABOVE_AVERAGE',
    })
    @IsOptional()
    @IsEnum(InternshipGroupTaskProgess)
    progress?: InternshipGroupTaskProgess;

    @ApiProperty({ 
        description: 'Các quy định vi phạm',
        enum: internshipRegulations,
        enumName: 'internshipRegulations',
        isArray: true,
        required: false,
        example: ['TASK_LATE', 'QUIZ_LATE']
    })
    @IsOptional()
    @IsArray()
    @IsEnum(internshipRegulations, { each: true })
    regulations?: internshipRegulations[];

    @ApiProperty({ 
        description: 'Lệnh/nhận xét từ mentor',
        required: false,
        example: 'Cần cải thiện phần UI, code sạch hơn'
    })
    @IsOptional()
    @IsString()
    mentorCommand?: string;

    @ApiProperty({ 
        description: 'Tên task',
        required: false,
        example: 'Implement login feature'
    })
    @IsOptional()
    @IsString()
    taskName?: string;

    @ApiProperty({ 
        description: 'Chi tiết công việc buổi sáng',
        required: false,
        example: 'Thiết kế UI login form theo Figma'
    })
    @IsOptional()
    @IsString()
    taskDetailMorning?: string;

    @ApiProperty({ 
        description: 'Chi tiết công việc buổi chiều',
        required: false,
        example: 'Implement API integration và validation'
    })
    @IsOptional()
    @IsString()
    taskDetailAfternoon?: string;
} 