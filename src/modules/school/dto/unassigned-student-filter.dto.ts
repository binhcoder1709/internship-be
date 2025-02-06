import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum SchoolAssignmentStatus {
    ALL = 'ALL',
    UNASSIGNED = 'UNASSIGNED',
    ASSIGNED = 'ASSIGNED'
}

export class UnassignedStudentFilterDto {
    @ApiProperty({ required: false })
    @IsOptional()
    page?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    limit?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ 
        required: false,
        enum: SchoolAssignmentStatus,
        default: SchoolAssignmentStatus.ALL,
        description: 'Lọc theo trạng thái phân công trường học'
    })
    @IsOptional()
    @IsEnum(SchoolAssignmentStatus)
    assignmentStatus?: SchoolAssignmentStatus;
} 