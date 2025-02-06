import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSchoolDto {
    @ApiProperty({
        description: 'Tên trường học',
        example: 'Trường THPT Chu Văn An',
        required: false
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Địa chỉ trường học',
        example: '120 Thụy Khuê, Tây Hồ, Hà Nội',
        required: false
    })
    @IsOptional()
    @IsString()
    address?: string;
} 