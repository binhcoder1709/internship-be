import { Controller, Get, Query, UseGuards, Request, HttpException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SchoolAdminService } from './school-admin.service';
import { StudentFilterDto } from './dto/student-filter.dto';
import { SchoolAdminAuthGuard } from 'src/guards/school-admin.guard';
import { DashboardService } from 'src/modules/dashboard/dashboard.service';
import { DashboardStatsDto } from 'src/modules/dashboard/dto/dashboard-stats.dto';

@ApiTags('School Admin Management')
@Controller('school-admin')
@UseGuards(SchoolAdminAuthGuard)
@ApiBearerAuth('access-token')
export class SchoolAdminController {
    constructor(
        private readonly schoolAdminService: SchoolAdminService,
        private readonly dashboardService: DashboardService
    ) {}

    @Get('students')
    @ApiOperation({ 
        summary: 'Lấy danh sách học sinh của trường',
        description: 'API cho phép school admin lấy danh sách học sinh thuộc trường của mình'
    })
    async getStudents(
        @Query() filter: StudentFilterDto,
        @Request() req
    ) {
        try {
            const { id } = req.schoolAdmin;
            // Lấy thông tin school admin
            const schoolAdmin = await this.schoolAdminService.findById(+id);
            if (!schoolAdmin || !schoolAdmin.school) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_ADMIN_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin admin hoặc trường học'
                }, 404);
            }

            const result = await this.schoolAdminService.getStudents(+schoolAdmin.school.id, filter);

            return {
                data: result.data,
                pagination: result.pagination,
                message: ['SV_NOTICE_GET_STUDENTS_SUCCESS'],
                description: 'Lấy danh sách học sinh thành công'
            };

        } catch (error) {
            console.log(error);
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GET_STUDENTS_FAILED'],
                description: 'Có lỗi xảy ra khi lấy danh sách học sinh'
            }, 500);
        }
    }

    @Get('students/:id')
    @ApiOperation({ 
        summary: 'Lấy chi tiết thông tin học sinh',
        description: 'API cho phép school admin xem chi tiết thông tin của một học sinh thuộc trường mình'
    })
    async getStudentDetail(
        @Param('id') studentId: number,
        @Request() req
    ) {
        try {
            const { id } = req.schoolAdmin;
            
            // Lấy thông tin school admin
            const schoolAdmin = await this.schoolAdminService.findById(id);
            if (!schoolAdmin || !schoolAdmin.school) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_ADMIN_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin admin hoặc trường học'
                }, 404);
            }

            const student = await this.schoolAdminService.getStudentDetail(studentId, schoolAdmin.school.id);
            if (!student) {
                throw new HttpException({
                    message: ['SV_ERR_STUDENT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin học sinh'
                }, 404);
            }

            return {
                data: student,
                message: ['SV_NOTICE_GET_STUDENT_DETAIL_SUCCESS'],
                description: 'Lấy thông tin chi tiết học sinh thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GET_STUDENT_DETAIL_FAILED'],
                description: 'Có lỗi xảy ra khi lấy thông tin chi tiết học sinh'
            }, 500);
        }
    }

    @Get('stats')
    @ApiOperation({
        summary: 'Lấy thống kê của trường',
        description: 'API lấy các số liệu thống kê về sinh viên của trường mình quản lý'
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy thống kê thành công',
        type: DashboardStatsDto
    })
    async getSchoolStats(@Request() req) {
        const stats = await this.dashboardService.getSchoolStats(+req.schoolAdmin.schoolId);
        return {
            data: stats,
            message: ['SV_NOTICE_SCHOOL_STATS_FETCHED'],
            description: 'Lấy thống kê trường thành công'
        };
    }
}
