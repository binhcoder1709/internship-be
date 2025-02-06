import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInternshipProjectDto {
    @ApiProperty({ description: 'Tên dự án' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Mô tả dự án', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Thời gian thực hiện (ngày)' })
    @IsInt()
    @Min(1)
    duration: number;

    @ApiProperty({ description: 'Số lượng thành viên yêu cầu' })
    @IsInt()
    @Min(1)
    memberCount: number;

    @ApiProperty({ description: 'Link SRS template', required: false })
    @IsString()
    @IsOptional()
    srsTemplateUrl?: string;

    @ApiProperty({ 
        description: 'Link task list',
        example: 'https://docs.google.com/spreadsheets/d/...',
        required: false 
    })
    @IsOptional()
    @IsString()
    taskListUrl?: string;

    @ApiProperty({ 
        description: 'Link thiết kế UI',
        example: 'https://www.figma.com/file/...',
        required: false 
    })
    @IsOptional()
    @IsString()
    uiDesignUrl?: string;

    @ApiProperty({ 
        description: 'Link thiết kế DB',
        example: 'https://drive.google.com/file/d/...',
        required: false 
    })
    @IsOptional()
    @IsString()
    databaseDesignUrl?: string;

    @ApiProperty({ 
        description: 'Link gitlab groups',
        example: 'https://gitlab.com/groups/...',
        required: false 
    })
    @IsOptional()
    @IsString()
    projectStructureUrl?: string;

    @ApiProperty({ 
        description: 'Link kế hoạch phân công',
        example: 'https://docs.google.com/spreadsheets/d/...',
        required: false 
    })
    @IsOptional()
    @IsString()
    projectPlanUrl?: string;
} 