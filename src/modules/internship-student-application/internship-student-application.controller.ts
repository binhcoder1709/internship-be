import { Body, Controller, Post, Request, UseGuards, HttpException, Get, Query, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudentAuthGuard } from 'src/guards/student-auth.guard';
import { InternshipStudentApplicationService } from './internship-student-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { GetApplicationsDto } from './dto/get-applications.dto';
import { CancelApplicationDto } from './dto/cancel-application.dto';
import { UpdateInterviewResponseDto } from './dto/update-interview-response.dto';

@ApiTags('Internship Student Application')
@Controller('internship-student-application')
@UseGuards(StudentAuthGuard)
@ApiBearerAuth('access-token')
export class InternshipStudentApplicationController {
    constructor(
        private readonly internshipStudentApplicationService: InternshipStudentApplicationService
    ) {}

    @Post()
    @ApiOperation({
        summary: 'Tạo đơn xin thực tập',
        description: 'API cho phép student tạo đơn xin thực tập'
    })
    async createApplication(@Body() dto: CreateApplicationDto, @Request() req) {
        try {
            // Kiểm tra position có tồn tại không
            const position = await this.internshipStudentApplicationService.findPosition(dto.internshipPositionId);
            if (!position) {
                throw new Error('POSITION_NOT_FOUND');
            }

            // Kiểm tra student đã có application cho position này chưa
            const existingApplication = await this.internshipStudentApplicationService
                .findExistingApplication(req.student.id, dto.internshipPositionId);
            if (existingApplication) {
                throw new Error('APPLICATION_ALREADY_EXISTS');
            }

            // Kiểm tra điều kiện các bài test
            const unfinishedExams = [];
            for (const requirement of position.internshipPositionRequirementList) {
                const bestAttempt = await this.internshipStudentApplicationService
                    .findBestAttempt(req.student.id, requirement.examSetId);
                
                if (!bestAttempt) {
                    unfinishedExams.push({
                        examSet: requirement.examSet,
                        minimumScore: requirement.minimumCompletionRate
                    });
                }
            }

            if (unfinishedExams.length > 0) {
                throw new HttpException({
                    message: ['EXAM_NOT_ATTEMPTED'],
                    description: 'Chưa hoàn thành các bài test yêu cầu',
                    unfinishedExams: unfinishedExams.map(exam => ({
                        examId: exam.examSet.id,
                        examTitle: exam.examSet.title,
                        minimumScore: exam.minimumScore
                    }))
                }, 400);
            }

            // Tạo application mới
            const application = await this.internshipStudentApplicationService
                .createApplication(req.student.id, dto);

            return {
                data: application,
                message: ['SV_NOTICE_APPLICATION_CREATED'],
                description: 'Tạo đơn xin thực tập thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException({
                message: [error.message],
                description: 'Không thể tạo đơn xin thực tập'
            }, 400);
        }
    }

    @Get()
    @ApiOperation({
        summary: 'Lấy danh sách đơn xin thực tập',
        description: 'API lấy danh sách đơn xin thực tập của student'
    })
    async getApplications(@Query() query: GetApplicationsDto, @Request() req) {
        const applications = await this.internshipStudentApplicationService
            .findApplications(req.student.id, query);

        return {
            data: applications,
            message: ['SV_NOTICE_APPLICATIONS_FETCHED'],
            description: 'Lấy danh sách đơn xin thực tập thành công'
        };
    }

    @Post(':id/cancel')
    @ApiOperation({
        summary: 'Hủy đơn xin thực tập',
        description: 'API cho phép student hủy đơn xin thực tập của mình'
    })
    async cancelApplication(
        @Param('id') id: number,
        @Body() dto: CancelApplicationDto,
        @Request() req
    ) {
        try {
            // Kiểm tra application có tồn tại không
            const application = await this.internshipStudentApplicationService
                .findApplicationById(id);
            if (!application) {
                throw new Error('APPLICATION_NOT_FOUND');
            }

            // Kiểm tra application có phải của student này không
            if (application.studentId !== req.student.id) {
                throw new Error('APPLICATION_NOT_OWNED');
            }

            // Kiểm tra application có thể hủy không (chỉ hủy được khi đang WAITING)
            if (application.progress !== 'WAITING') {
                throw new Error('APPLICATION_CANNOT_BE_CANCELLED');
            }

            // Cập nhật application
            const updatedApplication = await this.internshipStudentApplicationService
                .cancelApplication(id, dto.cancelReason);

            return {
                data: updatedApplication,
                message: ['SV_NOTICE_APPLICATION_CANCELLED'],
                description: 'Hủy đơn xin thực tập thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: [error.message],
                description: 'Không thể hủy đơn xin thực tập'
            }, 400);
        }
    }

    @Post(':id/interview-response')
    @UseGuards(StudentAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Cập nhật phản hồi phỏng vấn',
        description: 'API cho phép student cập nhật kết quả và ghi chú phỏng vấn'
    })
    async updateInterviewResponse(
        @Param('id') id: number,
        @Body() dto: UpdateInterviewResponseDto,
        @Request() req
    ) {
        try {
            // Kiểm tra application có tồn tại không
            const application = await this.internshipStudentApplicationService
                .findApplicationById(id);
            if (!application) {
                throw new Error('APPLICATION_NOT_FOUND');
            }

            // Kiểm tra application có phải của student này không
            if (application.studentId !== req.student.id) {
                throw new Error('APPLICATION_NOT_OWNED');
            }

            // Cập nhật phản hồi phỏng vấn
            const updatedApplication = await this.internshipStudentApplicationService
                .updateInterviewResponse(id, dto);

            return {
                data: updatedApplication,
                message: ['SV_NOTICE_INTERVIEW_RESPONSE_UPDATED'],
                description: 'Cập nhật phản hồi phỏng vấn thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: [error.message],
                description: 'Không thể cập nhật phản hồi phỏng vấn'
            }, 400);
        }
    }
}
