import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class UpdateStudentStatusDto {
    @ApiProperty({ 
        description: 'Trạng thái học sinh',
        enum: StudentStatus,
        example: 'ACTIVE'
    })
    @IsEnum(StudentStatus)
    status: StudentStatus;
} 