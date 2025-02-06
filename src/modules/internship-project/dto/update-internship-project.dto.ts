import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateInternshipProjectDto {
    @ApiProperty({ description: 'Tên dự án', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: 'Mô tả dự án', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Thời gian thực hiện (ngày)', required: false })
    @IsInt()
    @Min(1)
    @IsOptional()
    duration?: number;

    @ApiProperty({ description: 'Số lượng thành viên yêu cầu', required: false })
    @IsInt()
    @Min(1)
    @IsOptional()
    memberCount?: number;

    @ApiProperty({ description: 'Link SRS template', required: false })
    @IsString()
    @IsOptional()
    srsTemplateUrl?: string;

    // ... các trường URL khác giữ nguyên
} 