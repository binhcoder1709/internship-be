import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto } from './dto';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';

@ApiTags('Question Management')
@Controller('question')
export class QuestionController {
    constructor(private readonly questionService: QuestionService) {}

    @Post()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Tạo câu hỏi mới (MASTER ONLY)' })
    @ApiBody({
        type: CreateQuestionDto,
        examples: {
            multiple_choice: {
                summary: 'Câu hỏi trắc nghiệm',
                description: 'Tạo câu hỏi trắc nghiệm với nhiều lựa chọn',
                value: {
                    type: 'MULTIPLE_CHOICE',
                    questionText: 'Javascript và Java là cùng một ngôn ngữ lập trình?',
                    choiceList: 'Đúng, Sai, Không chắc chắn',
                    choiceCorrectIndex: 1
                }
            },
            coding: {
                summary: 'Câu hỏi lập trình',
                description: 'Tạo câu hỏi lập trình với test cases',
                value: {
                    type: 'CODING',
                    questionText: 'Viết hàm tính tổng hai số nguyên',
                    languageId: 63,
                    codingInitCode: `function addTwo(a, b) {
  // Code của bạn tại đây
}`,
                    codingTestTemplate: `const [a, b] = input.split(' ').map(Number);
const result = addTwo(a, b);
console.log(result);`,
                    codingTestCases: '[{"input":"3 5","expected":"8"},{"input":"5 6","expected":"11"},{"input":"10 20","expected":"30"}]',
                    codingPerformanceCheck: true,
                    codingTimeLimit: 1000,
                    codingMemoryLimit: 64000
                }
            },
            fill_in_blank_single: {
                summary: 'Câu hỏi điền vào chỗ trống (1 vị trí)',
                description: 'Tạo câu hỏi điền vào chỗ trống với 1 vị trí (sử dụng {blank} để đánh dấu chỗ trống)',
                value: {
                    type: 'FILL_IN_THE_BLANK',
                    questionText: 'TypeScript là một {blank} của JavaScript',
                    fillAswer: 'superset',
                    fillCaseSensitive: false
                }
            },
            fill_in_blank_multiple: {
                summary: 'Câu hỏi điền vào chỗ trống (nhiều vị trí)',
                description: 'Tạo câu hỏi điền vào chỗ trống với nhiều vị trí (sử dụng {blank} để đánh dấu chỗ trống, đáp án phân cách bởi dấu phẩy theo thứ tự)',
                value: {
                    type: 'FILL_IN_THE_BLANK',
                    questionText: 'Trong JavaScript, {blank} được sử dụng để khai báo biến và {blank} để khai báo hằng số',
                    fillAswer: 'let,const',
                    fillCaseSensitive: false
                }
            },
            essay: {
                summary: 'Câu hỏi tiểu luận',
                description: 'Tạo câu hỏi tiểu luận (chỉ cần điền nội dung câu hỏi)',
                value: {
                    type: 'ESSAY',
                    questionText: 'Hãy phân tích ưu và nhược điểm của việc sử dụng TypeScript so với JavaScript thuần túy trong phát triển ứng dụng web.'
                }
            }
        }
    })
    async create(
        @Body() data: CreateQuestionDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const question = await this.questionService.create(data);
            return {
                data: question,
                message: ['SV_NOTICE_QUESTION_CREATED'],
                description: 'Tạo câu hỏi thành công'
            };
        } catch (error) {
            //console.log("error", error);
            if (error.code === 'P2003') {
                throw new HttpException({
                    message: ['SV_ERR_LANGUAGE_NOT_FOUND'],
                    description: 'Không tìm thấy ngôn ngữ lập trình'
                }, 404);
            }
            throw new HttpException({
                message: ['SV_ERR_QUESTION_CREATE_FAILED'],
                description: 'Có lỗi xảy ra khi tạo câu hỏi'
            }, 500);
        }
    }

    @Put(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cập nhật câu hỏi (MASTER ONLY)' })
    @ApiParam({ name: 'id', description: 'ID của câu hỏi' })
    async update(@Param('id') id: string, @Body() data: UpdateQuestionDto) {
        try {
            const question = await this.questionService.update(Number(id), data);
            return {
                data: question,
                message: ['SV_NOTICE_QUESTION_UPDATED'],
                description: 'Cập nhật câu hỏi thành công'
            };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new HttpException({
                    message: ['SV_ERR_QUESTION_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin câu hỏi'
                }, 404);
            }
            throw new HttpException({
                message: ['SV_ERR_QUESTION_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật câu hỏi'
            }, 500);
        }
    }

    @Delete(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Xóa câu hỏi (MASTER ONLY)' })
    @ApiParam({ name: 'id', description: 'ID của câu hỏi' })
    async delete(@Param('id') id: string) {
        try {
            await this.questionService.delete(Number(id));
            return {
                message: ['SV_NOTICE_QUESTION_DELETED'],
                description: 'Xóa câu hỏi thành công'
            };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new HttpException({
                    message: ['SV_ERR_QUESTION_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin câu hỏi'
                }, 404);
            }
            throw new HttpException({
                message: ['SV_ERR_QUESTION_DELETE_FAILED'],
                description: 'Có lỗi xảy ra khi xóa câu hỏi'
            }, 500);
        }
    }

    @Get()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy danh sách câu hỏi (MASTER ONLY)' })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang' })
    @ApiQuery({ name: 'limit', required: false, description: 'Số lượng mỗi trang' })
    @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm' })
    @ApiQuery({ name: 'type', required: false, description: 'Loại câu hỏi' })
    @ApiQuery({ name: 'excludeExamSetId', required: false, description: 'ID của exam set muốn loại trừ (để lấy ra các câu hỏi chưa có trong bộ đề này)' })
    async findAll(@Query() filter: QuestionFilterDto) {
        try {
            const questions = await this.questionService.findAll(filter);
            return {
                data: questions,
                message: ['SV_NOTICE_QUESTION_LIST'],
                description: 'Lấy danh sách câu hỏi thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_QUESTION_LIST_FAILED'],
                description: 'Có lỗi xảy ra khi lấy danh sách câu hỏi'
            }, 500);
        }
    }
}
