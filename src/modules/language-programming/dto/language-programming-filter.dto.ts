import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LanguageProgrammingFilterDto {
    @ApiProperty({ required: false, description: 'Tìm kiếm theo tên ngôn ngữ' })
    @IsOptional()
    @IsString()
    search?: string;
} 