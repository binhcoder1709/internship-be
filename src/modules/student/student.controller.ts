import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query, UseGuards, Headers, Request, UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { StudentAuthGuard } from 'src/guards/student-auth.guard';
import { UpdateStudentAvatarDto } from './dto/update-student-avatar.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto';
import { UpdateStudentSchoolDto } from './dto/update-student-school.dto';

@Controller('student')
export class StudentController {
    constructor(private readonly studentService: StudentService) {}
    @Put(':id/status')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cập nhật trạng thái học sinh (MASTER ONLY)' })
    async updateStatus(
        @Param('id') id: number,
        @Body() data: UpdateStudentStatusDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra student tồn tại
            const student = await this.studentService.findById(id);
            if (!student) {
                throw new HttpException({
                    message: ['SV_ERR_STUDENT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin học sinh'
                }, 404);
            }

            // 2. Cập nhật trạng thái
            const updated = await this.studentService.update(id, { status: data.status });

            return {
                data: updated,
                message: ['SV_NOTICE_STUDENT_STATUS_UPDATED'],
                description: 'Cập nhật trạng thái học sinh thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException({
                message: ['SV_ERR_STUDENT_STATUS_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật trạng thái học sinh'
            }, 500);
        }
    }


    @ApiTags('Student Management (For Student)')
    @Put('profile')
    @UseGuards(StudentAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cập nhật thông tin cá nhân (STUDENT ONLY)' })
    async updateProfile(
        @Request() req,
        @Body() data: UpdateStudentProfileDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra student tồn tại
            const student = await this.studentService.findById(req.student.id);
            if (!student) {
                throw new NotFoundException({
                    message: ['SV_ERR_STUDENT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin học sinh'
                });
            }

            // 2. Cập nhật thông tin
            const updated = await this.studentService.update(req.student.id, data);

            return {
                data: updated,
                message: ['SV_NOTICE_STUDENT_PROFILE_UPDATED'],
                description: 'Cập nhật thông tin cá nhân thành công'
            };

        } catch (error) {
            //console.log("error", error)
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException({
                message: ['SV_ERR_STUDENT_PROFILE_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật thông tin cá nhân'
            }, 500);
        }
    }

    @Post()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Tạo học sinh mới (MASTER ONLY)' })
    async create(
        @Body() data: CreateStudentDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const student = await this.studentService.create(data);
            return {
                data: student,
                message: ['SV_NOTICE_STUDENT_CREATED'],
                description: 'Tạo học sinh thành công'
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new HttpException({
                    message: ['SV_ERR_DUPLICATE_EMAIL'],
                    description: 'Email hoặc số điện thoại đã tồn tại'
                }, 400);
            }
            throw new HttpException({
                message: ['SV_ERR_STUDENT_CREATE_FAILED'],
                description: 'Có lỗi xảy ra khi tạo học sinh'
            }, 500);
        }
    }

    @Put(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cập nhật thông tin học sinh (MASTER ONLY)' })
    async update(
        @Param('id') id: number,
        @Body() data: UpdateStudentDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const student = await this.studentService.findById(id);
            if (!student) {
                throw new HttpException({
                    message: ['SV_ERR_STUDENT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin học sinh'
                }, 404);
            }
            const updated = await this.studentService.update(id, data);
            return {
                data: updated,
                message: ['SV_NOTICE_STUDENT_UPDATED'],
                description: 'Cập nhật học sinh thành công'
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new HttpException({
                    message: ['SV_ERR_DUPLICATE_EMAIL'],
                    description: 'Email hoặc số điện thoại đã tồn tại'
                }, 400);
            }
            throw new HttpException({
                message: ['SV_ERR_STUDENT_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật học sinh'
            }, 500);
        }
    }

    @Delete(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Xóa học sinh (MASTER ONLY)' })
    async delete(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            const student = await this.studentService.findById(id);
            if (!student) {
                throw new HttpException({
                    message: ['SV_ERR_STUDENT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin học sinh'
                }, 404);
            }
            await this.studentService.delete(id);
            return {
                message: ['SV_NOTICE_STUDENT_DELETED'],
                description: 'Xóa học sinh thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_STUDENT_DELETE_FAILED'],
                description: 'Có lỗi xảy ra khi xóa học sinh'
            }, 500);
        }
    }

    @Get(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy thông tin học sinh (MASTER ONLY)' })
    async findOne(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            const student = await this.studentService.findById(id);
            if (!student) {
                throw new HttpException({
                    message: ['SV_ERR_STUDENT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin học sinh'
                }, 404);
            }
            return student;
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER'],
                description: 'Có lỗi xảy ra khi tìm kiếm học sinh'
            }, 500);
        }
    }

    @Get()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy danh sách học sinh (MASTER ONLY)' })
    async findAll(
        @Query() filter: StudentFilterDto,
        @Headers('authorization') auth: string
    ) {
        try {
            return await this.studentService.findAll(filter);
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER'],
                description: 'Có lỗi xảy ra khi lấy danh sách học sinh'
            }, 500);
        }
    }

    
    @ApiTags('Student Management (For Student)')
    @Put('profile/avatar')
    @UseGuards(StudentAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cập nhật avatar (STUDENT ONLY)' })
    @UseInterceptors(FileInterceptor('avatar'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'File ảnh avatar',
        type: UpdateStudentAvatarDto,
    })
    async updateAvatar(
        @Request() req,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new FileTypeValidator({ fileType: '.(jpg|jpeg|png)' }),
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }) // 2MB
                ]
            })
        ) file: Express.Multer.File,
        @Headers('authorization') auth: string
    ) {
        try {
            req.student.id = +req.student.id;
            // 1. Kiểm tra student tồn tại
            const student = await this.studentService.findById(req.student.id);
            if (!student) {
                throw new NotFoundException({
                    message: ['SV_ERR_STUDENT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin học sinh'
                });
            }

            // 2. Xóa avatar cũ nếu có
            if (student.avatar && student.avatar !== '/images/default/default_student_avatar.png') {
                const oldPath = path.join(process.cwd(), 'public', student.avatar);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (error) {
                        console.error('Error deleting old avatar:', error);
                    }
                }
            }

            // 3. Tạo tên file và đường dẫn mới
            const fileExt = path.extname(file.originalname);
            const fileName = `student_${req.student.id}_avatar${fileExt}`;
            const relativePath = `/images/uploads/students/avatar/${fileName}`;
            const absolutePath = path.join(process.cwd(), 'public', relativePath);

            // 4. Đảm bảo thư mục tồn tại
            const dir = path.dirname(absolutePath);
            if (!fs.existsSync(dir)) {
                try {
                    fs.mkdirSync(dir, { recursive: true });
                } catch (error) {
                    throw new HttpException({
                        message: ['SV_ERR_STUDENT_AVATAR_UPDATE_FAILED'],
                        description: 'Không thể tạo thư mục lưu trữ avatar'
                    }, 500);
                }
            }

            // 5. Lưu file mới
            try {
                fs.writeFileSync(absolutePath, file.buffer);
            } catch (error) {
                throw new HttpException({
                    message: ['SV_ERR_STUDENT_AVATAR_UPDATE_FAILED'],
                    description: 'Không thể lưu file avatar'
                }, 500);
            }

            // 6. Cập nhật đường dẫn trong database
            const updatedStudent = await this.studentService.updateAvatar(req.student.id, relativePath);

            return {
                data: { avatar: updatedStudent.avatar },
                message: ['SV_NOTICE_STUDENT_AVATAR_UPDATED'],
                description: 'Cập nhật avatar thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException({
                message: ['SV_ERR_STUDENT_AVATAR_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật avatar'
            }, 500);
        }
    }

    @Put(':id/school')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Cập nhật trường học cho học sinh (MASTER ONLY)',
        description: 'API cho phép MASTER cập nhật schoolId cho học sinh'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                schoolId: {
                    type: 'number',
                    example: 1,
                    description: 'ID của trường học'
                }
            }
        }
    })
    async updateSchool(
        @Param('id') id: number,
        @Body() data: UpdateStudentSchoolDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // 1. Kiểm tra student tồn tại
            const student = await this.studentService.findById(id);
            if (!student) {
                throw new HttpException({
                    message: ['SV_ERR_STUDENT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin học sinh'
                }, 404);
            }

            // 2. Kiểm tra school tồn tại
            const school = await this.studentService.findSchoolById(data.schoolId);
            if (!school) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin trường học'
                }, 404);
            }

            // 3. Cập nhật schoolId
            const updated = await this.studentService.update(id, { schoolId: data.schoolId });

            return {
                data: updated,
                message: ['SV_NOTICE_STUDENT_SCHOOL_UPDATED'],
                description: 'Cập nhật trường học cho học sinh thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_STUDENT_SCHOOL_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật trường học cho học sinh'
            }, 500);
        }
    }
}
