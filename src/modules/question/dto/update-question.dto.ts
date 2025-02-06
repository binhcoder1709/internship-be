import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { QuestionType } from '@prisma/client';

export class UpdateQuestionDto {
    @ApiProperty({ enum: QuestionType })
    @IsEnum(QuestionType)
    type: QuestionType;

    @ApiProperty()
    @IsString()
    questionText: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    languageId?: number;

    // MULTIPLE_CHOICE
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    choiceList?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    choiceCorrectIndex?: number;

    // CODING
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    codingInitCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    codingTestTemplate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    codingTestCases?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    codingPerformanceCheck?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    codingTimeLimit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    codingMemoryLimit?: number;

    // FILL_IN_THE_BLANK
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fillAswer?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    fillCaseSensitive?: boolean;
} 