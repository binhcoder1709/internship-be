import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateStudentSchoolDto {
    @ApiProperty({
        description: 'ID của trường học',
        example: 1
    })
    @IsNumber()
    schoolId: number;
} 