import { IsEnum, IsString, IsArray, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InternshipGroupStudentResult, InternshipGroupStudentRegulation } from '@prisma/client';

export class UpdateStudentResultDto {
    @ApiProperty({
        enum: InternshipGroupStudentResult,
        description: `Kết quả thực tập của sinh viên:
        WAITING = Chờ xử lý
        UNFINISHED = Không hoàn thành
        DONE_AVERAGE = Trung bình
        DONE_ABOVE_AVERAGE = Khá
        DONE_PROFICIENT = Giỏi
        DONE_EXCELLENT = Xuất sắc`
    })
    @IsEnum(InternshipGroupStudentResult)
    internshipResult: InternshipGroupStudentResult;

    @ApiProperty({
        type: [String],
        enum: InternshipGroupStudentRegulation,
        required: false,
        description: 'Các vi phạm (bắt buộc nếu kết quả là UNFINISHED)'
    })
    @ValidateIf(o => o.internshipResult === 'UNFINISHED')
    @IsArray()
    @IsEnum(InternshipGroupStudentRegulation, { each: true })
    internshipRegulation?: InternshipGroupStudentRegulation[];

    @ApiProperty({
        required: false,
        description: 'Ghi chú đánh giá (bắt buộc nếu kết quả là DONE_*)'
    })
    @ValidateIf(o => ['DONE_AVERAGE', 'DONE_ABOVE_AVERAGE', 'DONE_PROFICIENT', 'DONE_EXCELLENT'].includes(o.internshipResult))
    @IsString()
    internshipNote?: string;
} 