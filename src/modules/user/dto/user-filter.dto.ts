import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class UserFilterDto {
    @ApiProperty({
        description: 'Trang hiện tại',
        example: 1,
        required: false
    })
    @IsOptional()
    page?: number = 1;

    @ApiProperty({
        description: 'Số lượng item trên một trang',
        example: 10,
        required: false
    })
    @IsOptional()
    limit?: number = 10;

    @ApiProperty({
        description: 'Từ khóa tìm kiếm (email hoặc họ tên)',
        example: 'mentor',
        required: false
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'Lọc theo vai trò',
        enum: UserRole,
        example: 'LECTURE',
        required: false
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiProperty({
        description: 'Lọc theo trạng thái',
        enum: UserStatus,
        example: 'ACTIVE',
        required: false
    })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;
} 