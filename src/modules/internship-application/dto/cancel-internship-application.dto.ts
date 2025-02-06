import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelInternshipApplicationDto {
    @ApiProperty({ description: 'Lý do hủy đơn' })
    @IsNotEmpty({ message: 'Lý do hủy đơn không được để trống' })
    @IsString()
    cancelReason: string;
} 