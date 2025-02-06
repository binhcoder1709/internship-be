import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query, UseGuards, Headers, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { ExamSetService } from './exam-set.service';
import { CreateExamSetDto } from './dto/create-exam-set.dto';
import { UpdateExamSetDto } from './dto/update-exam-set.dto';
import { ExamSetFilterDto } from './dto/exam-set-filter.dto';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';

@ApiTags('Exam Set Management')
@Controller('exam-set')
export class ExamSetController {
    constructor(private readonly examSetService: ExamSetService) {}

    @Post()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Tạo bộ đề mới (MASTER ONLY)' })
    async create(
        @Body() data: CreateExamSetDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const examSet = await this.examSetService.create({
                ...data,
                type: data.type || 'ONE_TIME' // Mặc định là ONE_TIME nếu không chỉ định
            });
            return {
                data: examSet,
                message: ['SV_NOTICE_EXAM_SET_CREATED'],
                description: 'Tạo bộ đề thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_EXAM_SET_CREATE_FAILED'],
                description: 'Có lỗi xảy ra khi tạo bộ đề'
            }, 500);
        }
    }

    @Put(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cập nhật bộ đề (MASTER ONLY)' })
    async update(
        @Param('id') id: number,
        @Body() data: UpdateExamSetDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const examSet = await this.examSetService.findById(+id);
            if (!examSet) {
                throw new HttpException({
                    message: ['SV_ERR_EXAM_SET_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin bộ đề'
                }, 404);
            }

            // Nếu đang chuyển từ FREE sang ONE_TIME, kiểm tra xem đã có attempts chưa
            if (examSet.type === 'FREE' && data.type === 'ONE_TIME') {
                const hasAttempts = await this.examSetService.hasAttempts(+id);
                if (hasAttempts) {
                    throw new HttpException({
                        message: ['SV_ERR_CANNOT_CHANGE_TYPE'],
                        description: 'Không thể chuyển sang chế độ một lần thi vì đã có thí sinh làm bài'
                    }, 400);
                }
            }

            const updated = await this.examSetService.update(+id, data);
            return {
                data: updated,
                message: ['SV_NOTICE_EXAM_SET_UPDATED'],
                description: 'Cập nhật bộ đề thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_EXAM_SET_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật bộ đề'
            }, 500);
        }
    }

    @Delete(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Xóa bộ đề (MASTER ONLY)' })
    async delete(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            const examSet = await this.examSetService.findById(+id);
            if (!examSet) {
                throw new HttpException({
                    message: ['SV_ERR_EXAM_SET_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin bộ đề'
                }, 404);
            }
            await this.examSetService.delete(+id);
            return {
                message: ['SV_NOTICE_EXAM_SET_DELETED'],
                description: 'Xóa bộ đề thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_EXAM_SET_DELETE_FAILED'],
                description: 'Có lỗi xảy ra khi xóa bộ đề'
            }, 500);
        }
    }

    @Get(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy thông tin bộ đề (MASTER ONLY)' })
    async findOne(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            const examSet = await this.examSetService.findById(+id);
            if (!examSet) {
                throw new HttpException({
                    message: ['SV_ERR_EXAM_SET_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin bộ đề'
                }, 404);
            }
            return examSet;
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER'],
                description: 'Có lỗi xảy ra khi tìm kiếm bộ đề'
            }, 500);
        }
    }

    @Get()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy danh sách bộ đề (MASTER ONLY)' })
    async findAll(
        @Query() filter: ExamSetFilterDto,
        @Headers('authorization') auth: string
    ) {
        try {
            return await this.examSetService.findAll(filter);
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER'],
                description: 'Có lỗi xảy ra khi lấy danh sách bộ đề'
            }, 500);
        }
    }

    @Post(':id/questions')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Thêm câu hỏi vào bộ đề (MASTER ONLY)' })
    @ApiParam({ name: 'id', description: 'ID của bộ đề' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                questionIds: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Danh sách ID của các câu hỏi cần thêm'
                }
            }
        }
    })
    async addQuestions(
        @Param('id') id: string,
        @Body('questionIds') questionIds: number[],
        @Headers('authorization') auth: string
    ) {
        // Validate input
        if (!questionIds || questionIds.length === 0) {
            throw new BadRequestException({
                message: ['SV_ERR_QUESTION_IDS_REQUIRED'],
                description: 'Danh sách ID câu hỏi không được để trống'
            });
        }

        // Validate và chuyển đổi questionIds
        const validQuestionIds = questionIds
            .map(id => {
                const numId = Number(id);
                return !isNaN(numId) && numId > 0 ? numId : null;
            })
            .filter(id => id !== null);

        if (validQuestionIds.length === 0) {
            throw new BadRequestException({
                message: ['SV_ERR_QUESTION_IDS_INVALID'],
                description: 'Danh sách ID câu hỏi không hợp lệ'
            });
        }

        // Kiểm tra exam set tồn tại
        const examSet = await this.examSetService.findById(+id);
        if (!examSet) {
            throw new NotFoundException({
                message: ['SV_ERR_EXAM_SET_NOT_FOUND'],
                description: 'Không tìm thấy thông tin bộ đề'
            });
        }

        // Kiểm tra questions tồn tại
        const existingQuestions = await this.examSetService.findQuestionsByIds(validQuestionIds);
        const existingIds = existingQuestions.map(q => q.id);
        const nonExistingIds = validQuestionIds.filter(id => !existingIds.includes(id));
        
        if (nonExistingIds.length > 0) {
            throw new NotFoundException({
                message: ['SV_ERR_QUESTION_NOT_FOUND'],
                description: `Không tìm thấy câu hỏi với ID: ${nonExistingIds.join(', ')}`
            });
        }

        // Thêm câu hỏi vào bộ đề
        await this.examSetService.addQuestions(+id, validQuestionIds);
        
        return {
            message: ['SV_NOTICE_EXAM_SET_QUESTIONS_ADDED'],
            description: 'Thêm câu hỏi vào bộ đề thành công'
        };
    }

    @Delete(':id/questions/:questionId')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Xóa câu hỏi khỏi bộ đề (MASTER ONLY)' })
    @ApiParam({ name: 'id', description: 'ID của bộ đề' })
    @ApiParam({ name: 'questionId', description: 'ID của câu hỏi cần xóa' })
    async removeQuestion(
        @Param('id') id: string,
        @Param('questionId') questionId: string,
        @Headers('authorization') auth: string
    ) {
        // Validate questionId
        const questionIdNum = +questionId;
        if (isNaN(questionIdNum) || questionIdNum <= 0) {
            throw new BadRequestException({
                message: ['SV_ERR_QUESTION_ID_INVALID'],
                description: 'ID câu hỏi không hợp lệ'
            });
        }

        // Kiểm tra exam set tồn tại
        const examSet = await this.examSetService.findById(+id);
        if (!examSet) {
            throw new NotFoundException({
                message: ['SV_ERR_EXAM_SET_NOT_FOUND'],
                description: 'Không tìm thấy thông tin bộ đề'
            });
        }

        // Kiểm tra relation tồn tại
        const relation = await this.examSetService.findExamSetQuestionRelation(+id, questionIdNum);
        if (!relation) {
            throw new NotFoundException({
                message: ['SV_ERR_EXAM_SET_QUESTION_NOT_FOUND'],
                description: 'Không tìm thấy câu hỏi trong bộ đề'
            });
        }

        // Xóa câu hỏi khỏi bộ đề
        await this.examSetService.removeQuestion(+id, questionIdNum);
        
        return {
            message: ['SV_NOTICE_EXAM_SET_QUESTION_REMOVED'],
            description: 'Xóa câu hỏi khỏi bộ đề thành công'
        };
    }
}
