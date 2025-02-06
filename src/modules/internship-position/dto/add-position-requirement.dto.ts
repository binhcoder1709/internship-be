import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class AddPositionRequirementDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    examSetId: number;

    @ApiProperty({ example: 70, description: 'Tỉ lệ hoàn thành tối thiểu (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    minimumCompletionRate: number;
} 