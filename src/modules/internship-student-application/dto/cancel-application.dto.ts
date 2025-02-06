import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CancelApplicationDto {
    @ApiProperty({
        description: 'Lý do hủy đơn'
    })
    @IsString()
    cancelReason: string;
} 