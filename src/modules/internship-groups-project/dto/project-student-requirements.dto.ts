import { ApiProperty } from '@nestjs/swagger';

export class ProjectStudentRequirementsDto {
    @ApiProperty({
        description: 'Danh sách các vị trí student cần được assign',
        example: ['student_1', 'student_2', 'student_3']
    })
    studentPositions: string[];

    @ApiProperty({
        description: 'Số lượng student yêu cầu',
        example: 3
    })
    requiredCount: number;
} 