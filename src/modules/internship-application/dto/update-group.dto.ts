import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateGroupDto {
    @ApiProperty({
        description: 'ID của nhóm thực tập'
    })
    @IsNumber()
    internshipGroupId: number;
} 