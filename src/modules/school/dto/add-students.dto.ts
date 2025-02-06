import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AddStudentsDto {
    @ApiProperty({ type: [Number], description: 'Danh sách ID của sinh viên' })
    @IsArray()
    @IsNumber({}, { each: true })
    studentIds: number[];
} 