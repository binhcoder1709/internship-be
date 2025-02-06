import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { InternshipApplicationType } from '@prisma/client';

export class CreateInternshipApplicationDto {
    @ApiProperty({ description: 'ID của vị trí thực tập' })
    @IsNumber()
    internshipPositionId: number;

    @ApiProperty({ description: 'Địa chỉ làm việc', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ 
        description: 'Loại hình thực tập', 
        enum: InternshipApplicationType,
        default: InternshipApplicationType.FULL_TIME
    })
    @IsOptional()
    @IsEnum(InternshipApplicationType)
    type?: InternshipApplicationType;
} 