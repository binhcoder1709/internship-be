import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, UseGuards, Query, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SchoolFilterDto } from './dto/school-filter.dto';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';
import { CreateSchoolAdminDto } from './dto/create-school-admin.dto';
import { UpdateSchoolAdminDto } from './dto/update-school-admin.dto';
import * as bcrypt from 'bcrypt';
import { GmailProvider } from 'src/providers/external/gmail.provider';
import { SchoolStudentFilterDto } from './dto/school-student-filter.dto';
import { AddStudentsDto } from './dto/add-students.dto';
import { SchoolAdminFilterDto } from './dto/school-admin-filter.dto';
import { UnassignedStudentFilterDto } from './dto/unassigned-student-filter.dto';

@ApiTags('School Management')
@Controller('school')
export class SchoolController {
    constructor(
        private readonly schoolService: SchoolService,
        private readonly gmailProvider: GmailProvider
    ) {}

    @Post()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Tạo trường học mới (MASTER ONLY)' })
    async create(
        @Body() data: CreateSchoolDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // Kiểm tra trường đã tồn tại chưa
            const existingSchool = await this.schoolService.findByName(data.name);
            
            if (existingSchool) {
                if (!existingSchool.deletedAt) {
                    // Trường hợp 1: Trường đang hoạt động
                    return {
                        data: existingSchool,
                        message: ['SV_NOTICE_SCHOOL_ALREADY_EXISTS'],
                        description: 'Trường học đã tồn tại trong hệ thống'
                    };
                } else {
                    // Trường hợp 2: Trường đã bị xóa
                    return {
                        data: existingSchool,
                        message: ['SV_NOTICE_SCHOOL_DELETED_EXISTS'],
                        description: 'Trường học đã tồn tại nhưng đang bị xóa. Bạn có thể khôi phục hoặc tạo đè.',
                        canRestore: true
                    };
                }
            }

            // Trường hợp 3: Tạo mới
            const school = await this.schoolService.create(data);
            return {
                data: school,
                message: ['SV_NOTICE_SCHOOL_CREATED'],
                description: 'Tạo trường học thành công'
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NAME_EXISTS'],
                    description: 'Tên trường đã tồn tại'
                }, 400);
            }
            throw new HttpException({
                message: ['SV_ERR_SCHOOL_CREATE_FAILED'],
                description: 'Có lỗi xảy ra khi tạo trường học'
            }, 500);
        }
    }

    @Put(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cập nhật thông tin trường học (MASTER ONLY)' })
    async update(
        @Param('id') id: number,
        @Body() data: UpdateSchoolDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const school = await this.schoolService.findById(id);
            if (!school) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin trường học'
                }, 404);
            }
            const updated = await this.schoolService.update(id, data);
            return {
                data: updated,
                message: ['SV_NOTICE_SCHOOL_UPDATED'],
                description: 'Cập nhật trường học thành công'
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NAME_EXISTS'],
                    description: 'Tên trường đã tồn tại'
                }, 400);
            }
            throw new HttpException({
                message: ['SV_ERR_SCHOOL_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật trường học'
            }, 500);
        }
    }

    @Delete(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Xóa trường học (MASTER ONLY)' })
    async delete(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            const school = await this.schoolService.findById(id);
            if (!school) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin trường học'
                }, 404);
            }
            await this.schoolService.delete(id);
            return {
                message: ['SV_NOTICE_SCHOOL_DELETED'],
                description: 'Xóa trường học thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER'],
                description: 'Có lỗi xảy ra khi xóa trường học'
            }, 500);
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin trường học' })
    async findOne(@Param('id') id: number) {
        try {
            const school = await this.schoolService.findById(id);
            if (!school) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin trường học'
                }, 404);
            }
            return school;
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER'],
                description: 'Có lỗi xảy ra khi tìm kiếm trường học'
            }, 500);
        }
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách trường học' })
    async findAll(@Query() filter: SchoolFilterDto) {
        try {
            return await this.schoolService.findAll(filter);
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER'],
                description: 'Có lỗi xảy ra khi lấy danh sách trường học'
            }, 500);
        }
    }

    @Post(':id/admin')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Tạo admin cho trường học (MASTER ONLY)',
        description: `API tạo tài khoản admin cho trường học:
        - Hệ thống sẽ tự động tạo mật khẩu ngẫu nhiên
        - Gửi email thông tin đăng nhập cho admin
        - Chỉ MASTER mới có quyền thực hiện`
    })
    async createSchoolAdmin(
        @Param('id') schoolId: number,
        @Body() data: CreateSchoolAdminDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra school tồn tại
            const school = await this.schoolService.findById(schoolId);
            if (!school) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin trường học'
                }, 404);
            }

            // 2. Kiểm tra email đã tồn tại
            const existingAdmin = await this.schoolService.findAdminByEmail(data.email);
            if (existingAdmin) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_ADMIN_EMAIL_EXISTS'],
                    description: 'Email đã được sử dụng'
                }, 400);
            }

            // 3. Tạo mật khẩu ngẫu nhiên
            const password = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(password, 10);

            // 4. Tạo school admin
            const schoolAdmin = await this.schoolService.createSchoolAdmin({
                ...data,
                schoolId: +schoolId,
                password: hashedPassword
            });

            // 5. Gửi email thông tin đăng nhập
            // TODO: Implement email sending
            this.gmailProvider.sendTextEmail(schoolAdmin.email, `
                - Rikkei Education (Internship Service) xin cảm ơn!
                - Tên trường: ${school.name}
                Thông tin đăng nhập trường học
                `, `Email: ${schoolAdmin.email}\nMật khẩu: ${password}`);

            return {
                data: {
                    id: schoolAdmin.id,
                    email: schoolAdmin.email,
                    fullName: schoolAdmin.fullName,
                    phoneNumber: schoolAdmin.phoneNumber,
                    school: schoolAdmin.school
                },
                message: ['SV_NOTICE_SCHOOL_ADMIN_CREATED'],
                description: 'Tạo tài khoản admin trường học thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_SCHOOL_ADMIN_CREATE_FAILED'],
                description: 'Có lỗi xảy ra khi tạo tài khoản admin'
            }, 500);
        }
    }

    @Put('admin/:id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Cập nhật thông tin admin trường học (MASTER ONLY)',
        description: 'API cập nhật thông tin admin trường học, chỉ MASTER mới có quyền thực hiện'
    })
    async updateSchoolAdmin(
        @Param('id') id: number,
        @Body() data: UpdateSchoolAdminDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra school admin tồn tại
            const schoolAdmin = await this.schoolService.findAdminById(id);
            if (!schoolAdmin) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_ADMIN_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin admin'
                }, 404);
            }

            // 2. Cập nhật thông tin
            const updated = await this.schoolService.updateSchoolAdmin(id, data);

            return {
                data: updated,
                message: ['SV_NOTICE_SCHOOL_ADMIN_UPDATED'],
                description: 'Cập nhật thông tin admin trường học thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_SCHOOL_ADMIN_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật thông tin admin'
            }, 500);
        }
    }

    @Get(':id/students')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy danh sách sinh viên của trường (MASTER ONLY)' })
    async getStudents(
        @Param('id') id: number,
        @Query() filter: SchoolStudentFilterDto
    ) {
        try {
            const school = await this.schoolService.findById(id);
            if (!school) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin trường học'
                }, 404);
            }

            const result = await this.schoolService.findStudents(id, filter);
            return {
                data: result.data,
                pagination: result.pagination,
                message: ['SV_NOTICE_SCHOOL_STUDENTS_FETCHED'],
                description: 'Lấy danh sách sinh viên thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_GET_SCHOOL_STUDENTS_FAILED'],
                description: 'Có lỗi xảy ra khi lấy danh sách sinh viên'
            }, 500);
        }
    }

    @Post(':id/students')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Thêm sinh viên vào trường (MASTER ONLY)' })
    async addStudents(
        @Param('id') id: number,
        @Body() data: AddStudentsDto
    ) {
        try {
            const school = await this.schoolService.findById(id);
            if (!school) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin trường học'
                }, 404);
            }

            await this.schoolService.addStudents(id, data.studentIds);
            return {
                message: ['SV_NOTICE_STUDENTS_ADDED_TO_SCHOOL'],
                description: 'Thêm sinh viên vào trường thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_ADD_STUDENTS_TO_SCHOOL_FAILED'],
                description: 'Có lỗi xảy ra khi thêm sinh viên vào trường'
            }, 500);
        }
    }

    @Delete(':schoolId/students/:studentId')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Xóa sinh viên khỏi trường (MASTER ONLY)' })
    async removeStudent(
        @Param('schoolId') schoolId: number,
        @Param('studentId') studentId: number
    ) {
        try {
            await this.schoolService.removeStudentFromSchool(schoolId, studentId);
            return {
                message: ['SV_NOTICE_STUDENT_REMOVED_FROM_SCHOOL'],
                description: 'Xóa sinh viên khỏi trường thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_REMOVE_STUDENT_FROM_SCHOOL_FAILED'],
                description: 'Có lỗi xảy ra khi xóa sinh viên khỏi trường'
            }, 500);
        }
    }

    @Get('admin/list')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy danh sách admin trường học (MASTER ONLY)' })
    @ApiResponse({ 
        status: 200,
        description: 'Lấy danh sách thành công',
        schema: {
            example: {
                data: [{
                    id: 1,
                    email: "schooladmin@example.com",
                    fullName: "Nguyễn Văn A",
                    phoneNumber: "0123456789",
                    status: "ACTIVE",
                    school: {
                        id: 1,
                        name: "Trường THPT ABC"
                    },
                    createdAt: "2024-03-15T07:30:00.000Z"
                }],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 50,
                    totalPages: 5
                }
            }
        }
    })
    async getAdminList(@Query() filter: SchoolAdminFilterDto) {
        try {
            return await this.schoolService.findAllAdmins(filter);
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_GET_SCHOOL_ADMIN_LIST_FAILED'],
                description: 'Có lỗi xảy ra khi lấy danh sách admin trường học'
            }, 500);
        }
    }

    @Get('students/unassigned')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy danh sách sinh viên (MASTER ONLY)',
        description: `API lấy danh sách sinh viên với các tùy chọn lọc:
        - ALL: Tất cả sinh viên
        - UNASSIGNED: Sinh viên chưa thuộc trường nào
        - ASSIGNED: Sinh viên đã thuộc trường`
    })
    @ApiResponse({ 
        status: 200,
        description: 'Lấy danh sách thành công',
        schema: {
            example: {
                data: [{
                    id: 1,
                    email: "student@example.com",
                    fullName: "Nguyễn Văn A",
                    phoneNumber: "0123456789",
                    status: "ACTIVE",
                    avatar: null,
                    gender: "MALE",
                    birthday: "2000-01-01",
                    school: {
                        id: 1,
                        name: "Trường THPT ABC"
                    }
                }],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 50,
                    totalPages: 5
                }
            }
        }
    })
    async getUnassignedStudents(@Query() filter: UnassignedStudentFilterDto) {
        try {
            return await this.schoolService.findUnassignedStudents(filter);
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_GET_UNASSIGNED_STUDENTS_FAILED'],
                description: 'Có lỗi xảy ra khi lấy danh sách sinh viên'
            }, 500);
        }
    }

    @Post('load-data')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Load dữ liệu trường học từ file JSON (MASTER ONLY)' })
    @ApiResponse({ 
        status: 200,
        description: 'Load dữ liệu thành công',
        schema: {
            example: {
                success: true,
                message: 'Đã thêm 100 trường học vào database',
                data: [{
                    id: 1,
                    name: "Trường Đại học Sư phạm Hà Nội 2",
                    address: "Vĩnh Phúc"
                }]
            }
        }
    })
    async loadSchoolData() {
        try {
            const result = await this.schoolService.loadSchoolData();
            return {
                success: true,
                message: `Đã thêm ${result.length} trường học vào database`,
                data: result
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_LOAD_SCHOOL_DATA_FAILED'],
                description: 'Có lỗi xảy ra khi load dữ liệu trường học'
            }, 500);
        }
    }

    @Post('restore-or-override/:id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Khôi phục hoặc tạo đè trường học đã xóa (MASTER ONLY)',
        description: 'API cho phép khôi phục trường đã xóa hoặc tạo mới đè lên trường đã xóa'
    })
    @ApiParam({
        name: 'id',
        type: 'number',
        description: 'ID của trường học cần khôi phục hoặc tạo đè'
    })
    @ApiQuery({
        name: 'mode',
        enum: ['restore', 'override'],
        enumName: 'RestoreMode',
        description: 'Chế độ xử lý: restore - Khôi phục | override - Tạo đè lên với thông tin gốc'
    })
    async restoreOrOverride(
        @Param('id') id: number,
        @Query('mode') mode: 'restore' | 'override',
        @Headers('authorization') auth: string
    ) {
        try {
            const existingSchool = await this.schoolService.findByIdWithDeleted(id);
            if (!existingSchool) {
                throw new Error('SCHOOL_NOT_FOUND');
            }

            if (!existingSchool.deletedAt) {
                throw new Error('SCHOOL_NOT_DELETED');
            }

            if (mode === 'restore') {
                // Cơ chế 2: Khôi phục trường
                const restoredSchool = await this.schoolService.restore(id);
                return {
                    data: restoredSchool,
                    message: ['SV_NOTICE_SCHOOL_RESTORED'],
                    description: 'Khôi phục trường học thành công'
                };
            } else if (mode === 'override') {
                // Cơ chế 1: Đổi tên trường cũ và tạo mới với thông tin gốc
                const result = await this.schoolService.overrideSchool(id);
                return {
                    data: result.newSchool,
                    oldSchool: result.oldSchool,
                    message: ['SV_NOTICE_SCHOOL_OVERRIDDEN'],
                    description: 'Tạo đè trường học thành công'
                };
            }

            throw new Error('INVALID_MODE');
        } catch (error) {
            if (error.message === 'SCHOOL_NOT_FOUND') {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NOT_FOUND'],
                    description: 'Không tìm thấy trường học'
                }, 404);
            }
            if (error.message === 'SCHOOL_NOT_DELETED') {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NOT_DELETED'],
                    description: 'Trường học chưa bị xóa'
                }, 400);
            }
            if (error.message === 'INVALID_MODE') {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_MODE'],
                    description: 'Chế độ không hợp lệ. Chỉ chấp nhận "restore" hoặc "override"'
                }, 400);
            }
            throw new HttpException({
                message: ['SV_ERR_SCHOOL_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật trường học'
            }, 500);
        }
    }
}
