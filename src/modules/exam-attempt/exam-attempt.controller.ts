import { Body, Controller, Post, UseGuards, Request, HttpException, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudentAuthGuard } from 'src/guards/student-auth.guard';
import { ExamAttemptService } from './exam-attempt.service';
import { CreateExamAttemptDto } from './dto/create-exam-attempt.dto';
import { ExamSetType } from '@prisma/client';

@ApiTags('Exam Attempt')
@Controller('exam-attempt')
export class ExamAttemptController {
    constructor(private readonly examAttemptService: ExamAttemptService) {}

    @Post()
    @UseGuards(StudentAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Bắt đầu phiên thi mới (STUDENT ONLY)' })
    async create(@Request() req, @Body() data: CreateExamAttemptDto, @Headers("Authorization") authorization: string) {
        try {
            // 1. Kiểm tra exam set tồn tại
            const examSet = await this.examAttemptService.findExamSet(data.examSetId);
            if (!examSet) {
                throw new HttpException({
                    message: ['SV_ERR_EXAM_SET_NOT_FOUND'],
                    description: 'Không tìm thấy bộ đề thi'
                }, 404);
            }

            // 2. Nếu là ONE_TIME, kiểm tra đã có attempt trước đó chưa
            if (examSet.type === 'ONE_TIME') {
                const previousAttempt = await this.examAttemptService.findPreviousAttempt(
                    req.student.id, 
                    data.examSetId
                );
                
                if (previousAttempt) {
                    throw new HttpException({
                        message: ['SV_ERR_ONE_TIME_EXAM'],
                        description: 'Bộ đề này chỉ được làm một lần duy nhất'
                    }, 400);
                }
            }

            // 3. Kiểm tra phiên thi đang diễn ra
            const existingAttempt = await this.examAttemptService.findOngoing(req.student.id, data.examSetId);

            if (existingAttempt) {
                const now = new Date();
                const startTime = new Date(existingAttempt.startTime);
                const timeLimitMs = existingAttempt.examSet.timeLimit * 60 * 1000;
                // Nếu đã hết thời gian làm bài
                if (now.getTime() > startTime.getTime() + timeLimitMs) {
                    // Cập nhật endTime
                    const endTime = new Date(startTime.getTime() + timeLimitMs);
                    await this.examAttemptService.update(existingAttempt.id, { endTime });

                    // Tạo phiên thi mới
                    const newAttempt = await this.examAttemptService.create({
                        studentId: req.student.id,
                        examSetId: data.examSetId,
                        startTime: now
                    });

                    return {
                        data: newAttempt,
                        message: ['SV_NOTICE_EXAM_ATTEMPT_CREATED'],
                        description: 'Tạo phiên thi mới thành công'
                    };
                }

                // Nếu chưa hết thời gian, trả về phiên thi hiện tại
                throw new HttpException({
                    message: ['SV_ERR_EXAM_ATTEMPT_IN_PROGRESS'],
                    description: 'Bạn đang có một phiên thi đang diễn ra',
                    data: existingAttempt
                }, 400);
            }

            // 4. Tạo phiên thi mới
            const attempt = await this.examAttemptService.create({
                studentId: req.student.id,
                examSetId: data.examSetId,
                startTime: new Date()
            });

            return {
                data: attempt,
                message: ['SV_NOTICE_EXAM_ATTEMPT_CREATED'],
                description: 'Tạo phiên thi thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException({
                message: ['SV_ERR_EXAM_ATTEMPT_CREATE_FAILED'],
                description: 'Có lỗi xảy ra khi tạo phiên thi'
            }, 500);
        }
    }
} 