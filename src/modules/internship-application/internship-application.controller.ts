import { Body, Controller, Get, Post, Put, Query, Request, UseGuards, HttpException, Headers, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import { StudentAuthGuard } from 'src/guards/student-auth.guard';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';
import { InternshipApplicationService } from './internship-application.service';
import { CreateInternshipApplicationDto } from './dto/create-internship-application.dto';
import { InternshipApplicationFilterDto } from './dto/internship-application-filter.dto';
import { RejectInternshipApplicationDto } from './dto/reject-internship-application.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { CancelInternshipApplicationDto } from './dto/cancel-internship-application.dto';
import { StudentApplicationFilterDto } from './dto/student-application-filter.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UpdateInterviewResultDto } from './dto/update-interview-result.dto';
import { GmailProvider } from 'src/providers/external/gmail.provider';

@ApiTags('Internship Application Management')
@Controller('internship-application')
export class InternshipApplicationController {
    constructor(
        private readonly internshipApplicationService: InternshipApplicationService,
        private readonly gmail: GmailProvider
    ) {}

    // @Post()
    // @UseGuards(StudentAuthGuard)
    // @ApiBearerAuth('access-token')
    // @ApiOperation({ summary: 'Tạo đơn apply thực tập (STUDENT ONLY)' })
    // async create(
    //     @Request() req,
    //     @Body() data: CreateInternshipApplicationDto,
    //     @Headers('authorization') auth: string
    // ) {
    //     try {
    //         // 1. Kiểm tra vị trí thực tập tồn tại
    //         const position = await this.internshipApplicationService.findPosition(data.internshipPositionId);
    //         if (!position) {
    //             throw new HttpException({
    //                 message: ['SV_ERR_POSITION_NOT_FOUND'],
    //                 description: 'Không tìm thấy vị trí thực tập'
    //             }, 404);
    //         }

    //         // 2. Kiểm tra xem đã apply vị trí này chưa
    //         const existingApplication = await this.internshipApplicationService.findExistingApplication(
    //             req.student.id,
    //             data.internshipPositionId
    //         );

    //         if (existingApplication) {
    //             throw new HttpException({
    //                 message: ['SV_ERR_ALREADY_APPLIED'],
    //                 description: 'Bạn đã apply vị trí này rồi'
    //             }, 400);
    //         }

    //         // 3. Tạo application mới
    //         const application = await this.internshipApplicationService.create({
    //             studentId: req.student.id,
    //             internshipPositionId: data.internshipPositionId,
    //             address: data.address,
    //             type: data.type || 'FULL_TIME'
    //         });

    //         return {
    //             data: application,
    //             message: ['SV_NOTICE_APPLICATION_CREATED'],
    //             description: 'Tạo đơn apply thành công'
    //         };
    //     } catch (error) {
    //         if (error instanceof HttpException) throw error;
    //         throw new HttpException({
    //             message: ['SV_ERR_CREATE_APPLICATION_FAILED'],
    //             description: 'Có lỗi xảy ra khi tạo đơn apply'
    //         }, 500);
    //     }
    // }

    @Get()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy danh sách đơn apply (MASTER ONLY)' })
    async findAll(
        @Query() filter: InternshipApplicationFilterDto,
        @Headers('authorization') auth: string
    ) {
        try {
            return await this.internshipApplicationService.findAll(filter);
        } catch (error) {
            console.log("error", error);
            throw new HttpException({
                message: ['SV_ERR_GET_APPLICATIONS_FAILED'],
                description: 'Có lỗi xảy ra khi lấy danh sách đơn apply'
            }, 500);
        }
    }

    @Put(':id/accepted')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Chấp nhận đơn thực tập (MASTER ONLY)',
        description: 'API chuyển trạng thái đơn từ WAITING sang ACCEPTED. Chỉ có thể chấp nhận đơn đang ở trạng thái WAITING.'
    })
    @ApiResponse({
        status: 200,
        description: 'Chấp nhận đơn thành công',
        schema: {
            example: {
                data: {
                    id: 1,
                    studentId: 1,
                    internshipPositionId: 1,
                    progress: 'ACCEPTED',
                    student: {
                        id: 1,
                        fullName: 'Nguyễn Văn A',
                        email: 'student@example.com'
                    },
                    internshipPosition: {
                        id: 1,
                        name: 'Frontend Developer'
                    }
                },
                message: ['SV_NOTICE_APPLICATION_PROGRESS_UPDATED'],
                description: 'Chấp nhận đơn thành công'
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Lỗi khi chấp nhận đơn',
        schema: {
            example: {
                message: ['SV_ERR_ALREADY_FINAL_PROGRESS'],
                description: 'Đơn đã được chấp nhận trước đó'
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy đơn',
        schema: {
            example: {
                message: ['SV_ERR_APPLICATION_NOT_FOUND'],
                description: 'Không tìm thấy đơn apply'
            }
        }
    })
    async updateProgress(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra application tồn tại
            const application = await this.internshipApplicationService.findById(+id);
            if (!application) {
                throw new HttpException({
                    message: ['SV_ERR_APPLICATION_NOT_FOUND'],
                    description: 'Không tìm thấy đơn apply'
                }, 404);
            }

            // 2. Xác định progress tiếp theo
            const progressOrder = ['WAITING', 'ACCEPTED'];
            const currentIndex = progressOrder.indexOf(application.progress);
            
            if (currentIndex === progressOrder.length - 1) {
                throw new HttpException({
                    message: ['SV_ERR_ALREADY_FINAL_PROGRESS'],
                    description: 'Đơn apply đã ở trạng thái cuối cùng'
                }, 400);
            }

            // Chỉ cho phép chuyển từ WAITING -> ACCEPTED
            const nextProgress = progressOrder[currentIndex + 1];

            // 3. Cập nhật progress
            const updated = await this.internshipApplicationService.updateProgress(+id, nextProgress);

            return {
                data: updated,
                message: ['SV_NOTICE_APPLICATION_PROGRESS_UPDATED'],
                description: 'Cập nhật tiến độ thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_UPDATE_PROGRESS_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật tiến độ'
            }, 500);
        }
    }

    @Put(':id/reject')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Từ chối đơn apply (MASTER ONLY)' })
    async reject(
        @Param('id') id: number,
        @Body() data: RejectInternshipApplicationDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra application tồn tại
            const application = await this.internshipApplicationService.findById(+id);
            if (!application) {
                throw new HttpException({
                    message: ['SV_ERR_APPLICATION_NOT_FOUND'],
                    description: 'Không tìm thấy đơn apply'
                }, 404);
            }

            // 2. Từ chối application
            const rejected = await this.internshipApplicationService.reject(+id, data.rejectReason);

            return {
                data: rejected,
                message: ['SV_NOTICE_APPLICATION_REJECTED'],
                description: 'Từ chối đơn apply thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_REJECT_APPLICATION_FAILED'],
                description: 'Có lỗi xảy ra khi từ chối đơn apply'
            }, 500);
        }
    }

    @Put(':id/interview')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cập nhật thông tin phỏng vấn (MASTER ONLY)' })
    async updateInterview(
        @Param('id') id: number,
        @Body() dto: UpdateInterviewDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra application tồn tại
            const application = await this.internshipApplicationService.findById(+id);
            if (!application) {
                throw new HttpException({
                    message: ['SV_ERR_APPLICATION_NOT_FOUND'],
                    description: 'Không tìm thấy đơn apply'
                }, 404);
            }

            // 2. Kiểm tra application phải ở trạng thái ACCEPTED
            if (application.progress !== 'ACCEPTED') {
                throw new HttpException({
                    message: ['SV_ERR_APPLICATION_NOT_ACCEPTED'],
                    description: 'Đơn apply chưa được chấp nhận'
                }, 400);
            }

            // 3. Cập nhật thông tin phỏng vấn và chuyển trạng thái
            const updated = await this.internshipApplicationService.updateInterview(+id, {
                ...dto,
                progress: 'INTERVIEW_WAIT_STUDENT_RESPONSE'
            });

            

            return {
                data: updated,
                message: ['SV_NOTICE_INTERVIEW_UPDATED'],
                description: 'Cập nhật thông tin phỏng vấn thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_UPDATE_INTERVIEW_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật thông tin phỏng vấn'
            }, 500);
        }
    }

    // @Put(':id/cancel')
    // @UseGuards(StudentAuthGuard)
    // @ApiBearerAuth('access-token')
    // @ApiOperation({ summary: 'Hủy đơn apply thực tập (STUDENT ONLY)' })
    // async cancel(
    //     @Param('id') id: number,
    //     @Body() data: CancelInternshipApplicationDto,
    //     @Request() req,
    //     @Headers('authorization') auth: string
    // ) {
    //     try {
    //         // 1. Kiểm tra application tồn tại
    //         const application = await this.internshipApplicationService.findById(+id);
    //         if (!application) {
    //             throw new HttpException({
    //                 message: ['SV_ERR_APPLICATION_NOT_FOUND'],
    //                 description: 'Không tìm thấy đơn apply'
    //             }, 404);
    //         }

    //         // 2. Kiểm tra application có phải của student này không
    //         if (application.studentId !== req.student.id) {
    //             throw new HttpException({
    //                 message: ['SV_ERR_UNAUTHORIZED'],
    //                 description: 'Bạn không có quyền hủy đơn apply này'
    //             }, 403);
    //         }

    //         // 3. Kiểm tra trạng thái có thể hủy không (chỉ được hủy khi chưa được accept)
    //         // if (application.progress !== 'WAITING') {
    //         //     throw new HttpException({
    //         //         message: ['SV_ERR_INVALID_STATUS_FOR_CANCEL'],
    //         //         description: 'Chỉ có thể hủy đơn khi đơn đang ở trạng thái chờ duyệt'
    //         //     }, 400);
    //         // }

    //         // 4. Hủy application
    //         const cancelled = await this.internshipApplicationService.cancel(+id, data.cancelReason);

    //         return {
    //             data: cancelled,
    //             message: ['SV_NOTICE_APPLICATION_CANCELLED'],
    //             description: 'Hủy đơn apply thành công'
    //         };
    //     } catch (error) {
    //         if (error instanceof HttpException) throw error;
    //         throw new HttpException({
    //             message: ['SV_ERR_CANCEL_APPLICATION_FAILED'],
    //             description: 'Có lỗi xảy ra khi hủy đơn apply'
    //         }, 500);
    //     }
    // }

    // @Get('my-applications')
    // @UseGuards(StudentAuthGuard)
    // @ApiBearerAuth('access-token')
    // @ApiOperation({ summary: 'Lấy danh sách đơn apply của bản thân (STUDENT ONLY)' })
    // async findAllByStudent(
    //     @Query() filter: StudentApplicationFilterDto,
    //     @Request() req,
    //     @Headers('authorization') auth: string
    // ) {
    //     try {
    //         // Xử lý phân trang
    //         const page = +(filter.page || 1);
    //         const limit = +(filter.limit || 10);
    //         const skip = (page - 1) * limit;

    //         // Xây dựng điều kiện tìm kiếm
    //         const where: any = {
    //             studentId: +req.student.id
    //         }; 

    //         if (filter.search) {
    //             where.OR = [
    //                 { internshipPosition: { name: { contains: filter.search } } },
    //                 { internshipPosition: { description: { contains: filter.search } } }
    //             ];
    //         }

    //         if (filter.progress) {
    //             where.progress = filter.progress;
    //         }

    //         if (filter.type) {
    //             where.type = filter.type;
    //         }

    //         // Thực hiện truy vấn song song
    //         const [total, items] = await Promise.all([
    //             this.internshipApplicationService.countByStudentId(where),
    //             this.internshipApplicationService.findByStudentId(where, skip, limit)
    //         ]);

    //         // Format dữ liệu trả về
    //         return {
    //             total,
    //             page,
    //             limit,
    //             totalPage: Math.ceil(total / limit),
    //             items,
    //             message: ['SV_NOTICE_MY_APPLICATIONS_LIST'],
    //             description: 'Lấy danh sách đơn apply của bạn thành công'
    //         };
    //     } catch (error) {
    //         throw new HttpException({
    //             message: ['SV_ERR_GET_MY_APPLICATIONS_FAILED'],
    //             description: 'Không thể lấy danh sách đơn apply của bạn'
    //         }, 500);
    //     }
    // }

    @Put(':id/group')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Phân nhóm cho đơn thực tập (MASTER ONLY)' })
    async updateGroup(
        @Param('id') id: number,
        @Body() dto: UpdateGroupDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra application tồn tại
            const application = await this.internshipApplicationService.findById(+id);
            if (!application) {
                throw new HttpException({
                    message: ['SV_ERR_APPLICATION_NOT_FOUND'],
                    description: 'Không tìm thấy đơn apply'
                }, 404);
            }

            // 2. Kiểm tra group tồn tại
            const group = await this.internshipApplicationService.findGroup(dto.internshipGroupId);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // 3. Kiểm tra trạng thái group có phải WAITING_FOR_MENTOR hoac WAITING_FOR_STUDENT không
            if (group.progress !== 'WAITING_FOR_MENTOR' && group.progress !== 'WAITING_FOR_STUDENT') {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_IN_REGISTRATION'],
                    description: 'Nhóm không còn ở giai đoạn đăng ký thành viên, vui lòng liên hệ trưởng nhóm hoặc moderator'
                }, 400);
            }

            // 4. Cập nhật application và thêm student vào group
            const result = await this.internshipApplicationService.updateGroupAndAddStudent(+id, +dto.internshipGroupId);

            return {
                data: result,
                message: ['SV_NOTICE_APPLICATION_GROUPED'],
                description: 'Phân nhóm thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_UPDATE_GROUP_FAILED'],
                description: 'Có lỗi xảy ra khi phân nhóm'
            }, 500);
        }
    }

    @Put(':id/interview-result')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Cập nhật kết quả phỏng vấn (MASTER ONLY)',
        description: 'API cập nhật kết quả và ghi chú phỏng vấn, đồng thời chuyển trạng thái sang INTERVIEWED'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                interviewResult: {
                    type: 'string',
                    enum: ['PASSED', 'FAILED', 'CANCELED'],
                    description: 'Kết quả phỏng vấn'
                },
                interviewResultNote: {
                    type: 'string',
                    description: 'Ghi chú kết quả phỏng vấn',
                    example: 'Ứng viên thể hiện tốt các kỹ năng yêu cầu'
                }
            },
            required: ['interviewResult']
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Cập nhật kết quả phỏng vấn thành công',
        schema: {
            example: {
                data: {
                    id: 1,
                    progress: 'INTERVIEWED',
                    interviewResult: 'PASSED',
                    interviewResultNote: 'Ứng viên thể hiện tốt các kỹ năng yêu cầu'
                },
                message: ['SV_NOTICE_INTERVIEW_RESULT_UPDATED'],
                description: 'Cập nhật kết quả phỏng vấn thành công'
            }
        }
    })
    async updateInterviewResult(
        @Param('id') id: number,
        @Body() dto: UpdateInterviewResultDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra application tồn tại
            const application = await this.internshipApplicationService.findById(+id);
            if (!application) {
                throw new HttpException({
                    message: ['SV_ERR_APPLICATION_NOT_FOUND'],
                    description: 'Không tìm thấy đơn apply'
                }, 404);
            }

            // 2. Kiểm tra application phải ở trạng thái INTERVIEW_WAIT_STUDENT_RESPONSE
            if (application.progress !== 'INTERVIEW_WAIT_STUDENT_RESPONSE') {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_APPLICATION_STATUS'],
                    description: 'Đơn không ở trạng thái chờ phỏng vấn'
                }, 400);
            }

            // 3. Cập nhật kết quả phỏng vấn
            const updated = await this.internshipApplicationService.updateInterviewResult(+id, {
                ...dto,
                progress: 'INTERVIEWED'
            });

            return {
                data: updated,
                message: ['SV_NOTICE_INTERVIEW_RESULT_UPDATED'],
                description: 'Cập nhật kết quả phỏng vấn thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_UPDATE_INTERVIEW_RESULT_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật kết quả phỏng vấn'
            }, 500);
        }
    }

    @Get(':id/exam-details')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy chi tiết kết quả làm bài của ứng viên (MASTER ONLY)',
        description: 'API trả về chi tiết tất cả các lần làm bài của ứng viên cho từng bộ đề yêu cầu'
    })
    async getApplicationExamDetails(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            return {
                data: await this.internshipApplicationService.getApplicationExamDetails(id),
                message: ['SV_NOTICE_GET_EXAM_DETAILS_SUCCESS'],
                description: 'Lấy chi tiết kết quả làm bài thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GET_EXAM_DETAILS_FAILED'],
                description: 'Có lỗi xảy ra khi lấy chi tiết kết quả làm bài'
            }, 500);
        }
    }
}
