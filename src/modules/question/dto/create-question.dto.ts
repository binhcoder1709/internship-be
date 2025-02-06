import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNumber, IsBoolean, ValidateIf } from 'class-validator';
import { QuestionType } from '@prisma/client';

export class CreateQuestionDto {
    @ApiProperty({ 
        enum: QuestionType,
        description: 'Loại câu hỏi',
        examples: {
            MULTIPLE_CHOICE: {
                value: 'MULTIPLE_CHOICE',
                description: 'Câu hỏi trắc nghiệm với nhiều lựa chọn',
            },
            CODING: {
                value: 'CODING',
                description: 'Câu hỏi lập trình với test cases',
            },
            FILL_IN_THE_BLANK: {
                value: 'FILL_IN_THE_BLANK',
                description: 'Câu hỏi điền vào chỗ trống',
            }
        }
    })
    @IsEnum(QuestionType)
    type: QuestionType;

    @ApiProperty({ 
        description: 'Nội dung câu hỏi',
        examples: {
            MULTIPLE_CHOICE: {
                value: 'Javascript và Java là cùng một ngôn ngữ lập trình?',
                description: 'Ví dụ cho câu hỏi trắc nghiệm'
            },
            CODING: {
                value: 'Viết hàm tính tổng hai số nguyên',
                description: 'Ví dụ cho câu hỏi lập trình'
            },
            FILL_IN_THE_BLANK: {
                value: 'TypeScript là một _____ của JavaScript',
                description: 'Ví dụ cho câu hỏi điền vào chỗ trống'
            }
        }
    })
    @IsString()
    questionText: string;

    // MULTIPLE_CHOICE fields
    @ApiPropertyOptional({ 
        description: '[MULTIPLE_CHOICE] Danh sách câu trả lời, phân cách bởi dấu phẩy',
        example: 'Đúng, Sai, Không chắc chắn',
        type: String
    })
    @IsString()
    @ValidateIf(o => o.type === QuestionType.MULTIPLE_CHOICE)
    choiceList?: string;

    @ApiPropertyOptional({ 
        description: '[MULTIPLE_CHOICE] Index của câu trả lời đúng (bắt đầu từ 0)',
        example: 1,
        type: Number,
        minimum: 0
    })
    @IsNumber()
    @ValidateIf(o => o.type === QuestionType.MULTIPLE_CHOICE)
    choiceCorrectIndex?: number;

    // CODING fields
    @ApiPropertyOptional({ 
        description: '[CODING] ID của ngôn ngữ lập trình',
        example: 1,
        type: Number
    })
    @IsNumber()
    @ValidateIf(o => o.type === QuestionType.CODING)
    languageId?: number;

    @ApiPropertyOptional({ 
        description: '[CODING] Code khởi tạo cho bài tập',
        example: 'function sum(a: number, b: number): number {\n  // Your code here\n}',
        type: String
    })
    @IsString()
    @ValidateIf(o => o.type === QuestionType.CODING)
    codingInitCode?: string;

    @ApiPropertyOptional({ 
        description: '[CODING] Template để chạy test cases',
        example: 'describe("sum", () => {\n  it("should return correct sum", () => {\n    expect(sum(1, 2)).toBe(3);\n  });\n});',
        type: String
    })
    @IsString()
    @ValidateIf(o => o.type === QuestionType.CODING)
    codingTestTemplate?: string;

    @ApiPropertyOptional({ 
        description: '[CODING] Danh sách test cases, định dạng JSON',
        example: '[{"input": [1, 2], "expected": 3}, {"input": [-1, 1], "expected": 0}]',
        type: String
    })
    @IsString()
    @ValidateIf(o => o.type === QuestionType.CODING)
    codingTestCases?: string;

    @ApiPropertyOptional({ 
        description: '[CODING] Có kiểm tra hiệu năng hay không',
        example: true,
        type: Boolean,
        default: false
    })
    @IsBoolean()
    @ValidateIf(o => o.type === QuestionType.CODING)
    codingPerformanceCheck?: boolean;

    @ApiPropertyOptional({ 
        description: '[CODING] Giới hạn thời gian chạy (milliseconds)',
        example: 1000,
        type: Number,
        minimum: 100
    })
    @IsNumber()
    @ValidateIf(o => o.type === QuestionType.CODING)
    codingTimeLimit?: number;

    @ApiPropertyOptional({ 
        description: '[CODING] Giới hạn bộ nhớ sử dụng (KB)',
        example: 64000,
        type: Number,
        minimum: 1024
    })
    @IsNumber()
    @ValidateIf(o => o.type === QuestionType.CODING)
    codingMemoryLimit?: number;

    // FILL_IN_THE_BLANK fields
    @ApiPropertyOptional({ 
        description: '[FILL_IN_THE_BLANK] Câu trả lời đúng, phân cách bởi dấu phẩy nếu có nhiều đáp án',
        example: 'superset,phiên bản mở rộng',
        type: String
    })
    @IsString()
    @ValidateIf(o => o.type === QuestionType.FILL_IN_THE_BLANK)
    fillAswer?: string;

    @ApiPropertyOptional({ 
        description: '[FILL_IN_THE_BLANK] Có phân biệt chữ hoa/thường hay không',
        example: false,
        type: Boolean,
        default: false
    })
    @IsBoolean()
    @ValidateIf(o => o.type === QuestionType.FILL_IN_THE_BLANK)
    fillCaseSensitive?: boolean;
} 