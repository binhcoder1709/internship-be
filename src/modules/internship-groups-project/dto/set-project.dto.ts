import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class SetProjectDto {
    @ApiProperty({ 
        description: 'ID của project cần gán cho nhóm',
        example: 1 
    })
    @IsInt()
    projectId: number;
} 