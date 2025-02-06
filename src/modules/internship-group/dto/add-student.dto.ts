import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddStudentDto {
    @ApiProperty({
        description: 'ID của student được thêm vào nhóm'
    })
    @IsNotEmpty()
    @IsNumber()
    studentId: number;
} 