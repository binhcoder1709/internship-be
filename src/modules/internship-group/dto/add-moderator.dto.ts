import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddModeratorDto {
    @ApiProperty({
        description: 'ID của user được thêm làm moderator'
    })
    @IsNotEmpty()
    @IsNumber()
    userId: number;
} 