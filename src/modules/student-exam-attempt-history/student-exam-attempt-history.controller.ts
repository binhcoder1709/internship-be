import { Controller, Get, Query, Request, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudentAuthGuard } from 'src/guards/student-auth.guard';
import { StudentExamAttemptHistoryService } from './student-exam-attempt-history.service';
import { GetExamAttemptHistoryDto } from './dto/get-exam-attempt-history.dto';

@ApiTags('Student Exam Attempt History')
@Controller('student-exam-attempt-history')
@UseGuards(StudentAuthGuard)
@ApiBearerAuth('access-token')
export class StudentExamAttemptHistoryController {
    constructor(
        private readonly studentExamAttemptHistoryService: StudentExamAttemptHistoryService
    ) {}

    @Get()
    @ApiOperation({
        summary: 'Lấy lịch sử làm bài thi của student',
        description: 'API cho phép student xem lịch sử làm bài thi của mình'
    })
    async getHistory(@Query() query: GetExamAttemptHistoryDto, @Request() req) {
        const { page = 1, limit = 10 } = query;
        const result = await this.studentExamAttemptHistoryService.getHistory(
            req.student.id,
            query
        );

        return {
            data: {
                items: result.items,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit)
                }
            },
            message: ['SV_NOTICE_GET_EXAM_HISTORY_SUCCESS'],
            description: 'Lấy lịch sử làm bài thi thành công'
        };
    }

    @Get('exam-set/:examSetId')
    @ApiOperation({
        summary: 'Lấy lịch sử làm bài của một bộ đề',
        description: 'API cho phép student xem lịch sử làm bài của một bộ đề cụ thể'
    })
    async getExamSetHistory(
        @Param('examSetId') examSetId: number,
        @Request() req
    ) {
        const result = await this.studentExamAttemptHistoryService
            .getExamSetHistory(req.student.id, examSetId);

        return {
            data: result,
            message: ['SV_NOTICE_GET_EXAM_SET_HISTORY_SUCCESS'],
            description: 'Lấy lịch sử làm bài của bộ đề thành công'
        };
    }
}
