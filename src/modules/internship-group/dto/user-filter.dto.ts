import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UserFilterDto {
    @ApiProperty({ 
        required: false,
        description: 'Số trang (mặc định: 1)'
    })
    @IsOptional()
    page?: number;

    @ApiProperty({ 
        required: false,
        description: 'Số lượng item trên một trang (mặc định: 10)'
    })
    @IsOptional()
    limit?: number;

    @ApiProperty({ 
        required: false,
        description: 'Tìm kiếm theo email hoặc tên người dùng'
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ 
        required: false,
        description: 'ID của nhóm để lọc user chưa là moderator của nhóm đó'
    })
    @IsOptional()
    @IsString()
    groupId?: number;
} 