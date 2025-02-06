import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNumber } from 'class-validator';

export class StartProjectDto {
    @ApiProperty({
        description: 'Mapping giữa vị trí student trong project và studentId',
        example: {
            "student_1": 1,
            "student_2": 2,
            "student_3": 3
        }
    })
    @IsObject()
    studentAssignments: Record<string, number>;

    @ApiProperty({
        description: 'Thời gian bắt đầu project (timestamp)',
        example: 1709251200000
    })
    @IsNumber()
    startTime: number;
} 