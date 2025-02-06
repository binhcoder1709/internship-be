import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { InternshipApplicationType } from '@prisma/client';

export class CreateApplicationDto {
    @ApiProperty()
    @IsNumber()
    internshipPositionId: number;

    @ApiProperty({ enum: InternshipApplicationType })
    @IsEnum(InternshipApplicationType)
    type: InternshipApplicationType;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    address?: string;
} 