import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({
        description: 'Họ và tên',
        example: 'Nguyễn Văn A',
        required: false
    })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({
        description: 'Mật khẩu mới',
        example: '123456',
        required: false
    })
    @IsOptional()
    @IsString()
    password?: string;
} 