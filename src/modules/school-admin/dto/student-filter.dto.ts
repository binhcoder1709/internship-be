import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { StudentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class StudentFilterDto {
    @ApiProperty({
        description: 'Trang hiện tại',
        required: false,
        default: 1
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page?: number;

    @ApiProperty({
        description: 'Số lượng item mỗi trang',
        required: false,
        default: 10
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit?: number;

    @ApiProperty({
        description: 'Từ khóa tìm kiếm (tìm theo tên, email, số điện thoại)',
        required: false
    })
    @IsOptional()
    search?: string;

    @ApiProperty({
        description: 'Lọc theo trạng thái',
        enum: StudentStatus,
        required: false
    })
    @IsOptional()
    @IsEnum(StudentStatus)
    status?: StudentStatus;
} 