import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateInternshipPositionDto {
    @ApiProperty({ example: 'Frontend Developer' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Vị trí thực tập Frontend Developer...', required: false })
    @IsString()
    @IsOptional()
    description?: string;
} 