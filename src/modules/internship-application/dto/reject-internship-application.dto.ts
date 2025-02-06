import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectInternshipApplicationDto {
    @ApiProperty({ description: 'Lý do từ chối' })
    @IsNotEmpty()
    @IsString()
    rejectReason: string;
} 