import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSchoolDto {
    @ApiProperty({
        description: 'Tên trường học',
        example: 'Trường THPT Chu Văn An'
    })
    @IsNotEmpty({ message: 'Tên trường là bắt buộc' })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Địa chỉ trường học',
        example: '120 Thụy Khuê, Tây Hồ, Hà Nội',
        required: false
    })
    @IsOptional()
    @IsString()
    address?: string;
} 