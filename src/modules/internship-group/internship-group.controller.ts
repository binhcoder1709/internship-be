import { Body, Controller, Get, Post, Put, Query, UseGuards, HttpException, Headers, Param, Request, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternshipGroupService } from './internship-group.service';
import { CreateInternshipGroupDto } from './dto/create-internship-group.dto';
import { UpdateInternshipGroupDto } from './dto/update-internship-group.dto';
import { InternshipGroupFilterDto } from './dto/internship-group-filter.dto';
import { UserAuthGuard } from 'src/guards/user-auth.guard';
import { AddModeratorDto } from './dto/add-moderator.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { OwnerGroupsFilterDto } from './dto/owner-groups-filter.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { StudentFilterDto } from './dto/student-filter.dto';
import { StudentAuthGuard } from 'src/guards/student-auth.guard';
import { StudentGroupsFilterDto } from './dto/student-groups-filter.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@ApiTags('Internship Group Management')
@Controller('internship-group')
export class InternshipGroupController {
    constructor(private readonly internshipGroupService: InternshipGroupService) {}

    @Post()
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Tạo nhóm thực tập (USER ONLY)',
        description: 'API tạo mới nhóm thực tập. Tên nhóm là duy nhất trong hệ thống. Người tạo sẽ là owner của nhóm.'
    })
    async create(
        @Body() data: CreateInternshipGroupDto,
        @Headers('authorization') auth: string,
        @Request() req
    ) {
        try {
            // Kiểm tra tên nhóm đã tồn tại chưa
            const existing = await this.internshipGroupService.findByName(data.name);
            if (existing) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NAME_EXISTS'],
                    description: 'Tên nhóm đã tồn tại'
                }, 400);
            }

            // Thêm ownerId từ user đang đăng nhập
            const group = await this.internshipGroupService.create({
                ...data,
                ownerId: req.user.id // Lấy user ID từ token
            });

            return {
                data: group,
                message: ['SV_NOTICE_GROUP_CREATED'],
                description: 'Tạo nhóm thực tập thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GROUP_CREATE_FAILED'],
                description: 'Không thể tạo nhóm thực tập'
            }, 500);
        }
    }

    @Get()
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy danh sách nhóm thực tập (USER ONLY)',
        description: `API lấy danh sách nhóm thực tập có phân trang và filter:
        - Tìm kiếm theo tên nhóm hoặc mô tả
        - Lọc theo trạng thái nhóm
        - Sắp xếp theo thời gian tạo mới nhất`
    })
    async findAll(
        @Query() filter: InternshipGroupFilterDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const page = +(filter.page || 1);
            const limit = +(filter.limit || 10);
            const skip = (page - 1) * limit;

            const where: any = {};

            if (filter.search) {
                where.OR = [
                    { name: { contains: filter.search } },
                    { description: { contains: filter.search } }
                ];
            }

            if (filter.progress) {
                where.progress = filter.progress;
            }

            const [total, items] = await Promise.all([
                this.internshipGroupService.count(where),
                this.internshipGroupService.findAll(where, skip, limit)
            ]);

            return {
                total,
                page,
                limit,
                totalPage: Math.ceil(total / limit),
                items,
                message: ['SV_NOTICE_GROUP_LIST'],
                description: 'Lấy danh sách nhóm thực tập thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_GROUP_LIST_FAILED'],
                description: 'Không thể lấy danh sách nhóm thực tập'
            }, 500);
        }
    }

    @Put(':id')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Cập nhật thông tin nhóm thực tập (USER ONLY)',
        description: 'API cập nhật thông tin nhóm thực tập. Tên nhóm mới không được trùng với các nhóm khác.'
    })
    async update(
        @Param('id') id: number,
        @Body() data: UpdateInternshipGroupDto,
        @Headers('authorization') auth: string
    ) {
        try {
            // Kiểm tra nhóm tồn tại
            const group = await this.internshipGroupService.findById(+id);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // Kiểm tra tên mới có bị trùng không
            const existing = await this.internshipGroupService.findByName(data.name, +id);
            if (existing) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NAME_EXISTS'],
                    description: 'Tên nhóm đã tồn tại'
                }, 400);
            }

            const updated = await this.internshipGroupService.update(+id, data);

            return {
                data: updated,
                message: ['SV_NOTICE_GROUP_UPDATED'],
                description: 'Cập nhật thông tin nhóm thực tập thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GROUP_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật thông tin nhóm thực tập'
            }, 500);
        }
    }

    @Post(':id/moderator')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Thêm moderator vào nhóm (OWNER ONLY)',
        description: 'API thêm moderator vào nhóm thực tập. Chỉ owner của nhóm mới có quyền thực hiện.'
    })
    async addModerator(
        @Param('id') id: number,
        @Body() data: AddModeratorDto,
        @Request() req
    ) {
        try {
            // Kiểm tra nhóm tồn tại
            const group = await this.internshipGroupService.findById(+id);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // Kiểm tra người gọi API có phải là owner
            const isOwner = await this.internshipGroupService.isGroupOwner(+id, req.user.id);
            if (!isOwner) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_OWNER'],
                    description: 'Bạn không phải là owner của nhóm này'
                }, 403);
            }

            // Kiểm tra moderator đã tồn tại chưa
            const existingModerator = await this.internshipGroupService.findModerator(+id, +data.userId);
            if (existingModerator) {
                throw new HttpException({
                    message: ['SV_ERR_MODERATOR_EXISTS'],
                    description: 'Người này đã là moderator của nhóm'
                }, 400);
            }

            const moderator = await this.internshipGroupService.addModerator(+id, +data.userId);

            return {
                data: moderator,
                message: ['SV_NOTICE_MODERATOR_ADDED'],
                description: 'Thêm moderator thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_ADD_MODERATOR_FAILED'],
                description: 'Không thể thêm moderator'
            }, 500);
        }
    }

    @Delete(':id/moderator/:userId')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Xóa moderator khỏi nhóm (OWNER ONLY)',
        description: 'API xóa moderator khỏi nhóm thực tập. Chỉ owner của nhóm mới có quyền thực hiện.'
    })
    async removeModerator(
        @Param('id') id: number,
        @Param('userId') userId: number,
        @Request() req
    ) {
        try {
            // Kiểm tra nhóm tồn tại
            const group = await this.internshipGroupService.findById(+id);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // Kiểm tra người gọi API có phải là owner
            const isOwner = await this.internshipGroupService.isGroupOwner(+id, req.user.id);
            if (!isOwner) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_OWNER'],
                    description: 'Bạn không phải là owner của nhóm này'
                }, 403);
            }

            // Kiểm tra moderator tồn tại
            const existingModerator = await this.internshipGroupService.findModerator(+id, +userId);
            if (!existingModerator) {
                throw new HttpException({
                    message: ['SV_ERR_MODERATOR_NOT_FOUND'],
                    description: 'Không tìm thấy moderator này trong nhóm'
                }, 404);
            }

            await this.internshipGroupService.removeModerator(+id, +userId);

            return {
                message: ['SV_NOTICE_MODERATOR_REMOVED'],
                description: 'Xóa moderator thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_REMOVE_MODERATOR_FAILED'],
                description: 'Không thể xóa moderator'
            }, 500);
        }
    }

    @Post(':id/student')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Thêm student vào nhóm (OWNER/MODERATOR ONLY)',
        description: 'API thêm student vào nhóm thực tập. Chỉ owner hoặc moderator của nhóm mới có quyền thực hiện.'
    })
    async addStudent(
        @Param('id') id: number,
        @Body() data: AddStudentDto,
        @Request() req
    ) {
        try {
            // Kiểm tra nhóm tồn tại
            const group = await this.internshipGroupService.findById(+id);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // Kiểm tra quyền truy cập
            const hasAccess = await this.internshipGroupService.hasGroupAccess(+id, req.user.id);
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            // Kiểm tra student đã tồn tại trong nhóm chưa
            const existingStudent = await this.internshipGroupService.findStudent(+id, +data.studentId);
            if (existingStudent) {
                throw new HttpException({
                    message: ['SV_ERR_STUDENT_EXISTS_IN_GROUP'],
                    description: 'Sinh viên này đã có trong nhóm'
                }, 400);
            }

            const student = await this.internshipGroupService.addStudent(+id, +data.studentId);

            return {
                data: student,
                message: ['SV_NOTICE_STUDENT_ADDED_TO_GROUP'],
                description: 'Thêm sinh viên vào nhóm thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_ADD_STUDENT_TO_GROUP_FAILED'],
                description: 'Không thể thêm sinh viên vào nhóm'
            }, 500);
        }
    }

    @Delete(':id/student/:studentId')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Xóa student khỏi nhóm (OWNER/MODERATOR ONLY)',
        description: 'API xóa student khỏi nhóm thực tập. Chỉ owner hoặc moderator của nhóm mới có quyền thực hiện.'
    })
    async removeStudent(
        @Param('id') id: number,
        @Param('studentId') studentId: number,
        @Request() req
    ) {
        try {
            // Kiểm tra nhóm tồn tại
            const group = await this.internshipGroupService.findById(+id);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // Kiểm tra quyền truy cập
            const hasAccess = await this.internshipGroupService.hasGroupAccess(+id, req.user.id);
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            // Kiểm tra student có trong nhóm không
            const existingStudent = await this.internshipGroupService.findStudent(+id, +studentId);
            if (!existingStudent) {
                throw new HttpException({
                    message: ['SV_ERR_STUDENT_NOT_FOUND_IN_GROUP'],
                    description: 'Không tìm thấy sinh viên này trong nhóm'
                }, 404);
            }

            await this.internshipGroupService.removeStudent(+id, +studentId);

            return {
                message: ['SV_NOTICE_STUDENT_REMOVED_FROM_GROUP'],
                description: 'Xóa sinh viên khỏi nhóm thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_REMOVE_STUDENT_FROM_GROUP_FAILED'],
                description: 'Không thể xóa sinh viên khỏi nhóm'
            }, 500);
        }
    }

    @Get('my-groups')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy danh sách nhóm của user (OWNER/MODERATOR)',
        description: `API lấy danh sách nhóm mà user đang đăng nhập là owner hoặc moderator:
        - Có phân trang
        - Tìm kiếm theo tên nhóm hoặc mô tả
        - Lọc theo trạng thái nhóm
        - Sắp xếp theo thời gian tạo mới nhất`
    })
    async findAllByOwnerOrModerator(
        @Query() filter: OwnerGroupsFilterDto,
        @Request() req
    ) {
        try {
            const page = +(filter.page || 1);
            const limit = +(filter.limit || 10);
            const skip = (page - 1) * limit;

            const where: any = {};

            if (filter.search) {
                where.OR = [
                    { name: { contains: filter.search } },
                    { description: { contains: filter.search } }
                ];
            }

            if (filter.progress) {
                where.progress = filter.progress;
            }

            const [total, items] = await Promise.all([
                this.internshipGroupService.countByOwnerOrModerator(req.user.id, where),
                this.internshipGroupService.findAllByOwnerOrModerator(req.user.id, where, skip, limit)
            ]);

            return {
                total,
                page,
                limit,
                totalPage: Math.ceil(total / limit),
                items,
                message: ['SV_NOTICE_GROUP_LIST'],
                description: 'Lấy danh sách nhóm thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_GROUP_LIST_FAILED'],
                description: 'Không thể lấy danh sách nhóm'
            }, 500);
        }
    }

    @Get(':id/details')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy chi tiết nhóm (OWNER/MODERATOR ONLY)',
        description: 'API lấy thông tin chi tiết của nhóm bao gồm danh sách moderator và student.'
    })
    async getDetails(
        @Param('id') id: number,
        @Request() req
    ) {
        try {
            const group = await this.internshipGroupService.findByIdWithDetails(+id);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // Kiểm tra quyền truy cập
            // const hasAccess = await this.internshipGroupService.hasGroupAccess(+id, req.user.id);
            // if (!hasAccess) {
            //     throw new HttpException({
            //         message: ['SV_ERR_NOT_GROUP_PERMISSION'],
            //         description: 'Bạn không có quyền thực hiện hành động này'
            //     }, 403);
            // }

            return {
                data: group,
                message: ['SV_NOTICE_GROUP_DETAILS_FETCHED'],
                description: 'Lấy thông tin chi tiết nhóm thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GET_GROUP_DETAILS_FAILED'],
                description: 'Không thể lấy thông tin chi tiết nhóm'
            }, 500);
        }
    }

    @Get('users')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy danh sách user (USER ONLY)',
        description: `API lấy danh sách user:
        - Có phân trang
        - Tìm kiếm theo email hoặc tên
        - Lọc user chưa là moderator của một nhóm cụ thể
        - Sắp xếp theo ID giảm dần`
    })
    async findAllUsers(
        @Query() filter: UserFilterDto
    ) {
        try {
            const page = +(filter.page || 1);
            const limit = +(filter.limit || 10);
            const skip = (page - 1) * limit;

            const where: any = {};

            if (filter.search) {
                where.OR = [
                    { email: { contains: filter.search } },
                    { fullName: { contains: filter.search } }
                ];
            }

            if (filter.groupId) {
                where.NOT = {
                    internshipGroupMonderator: {
                        some: {
                            internshipGroupId: +filter.groupId
                        }
                    }
                };
            }

            const [total, items] = await Promise.all([
                this.internshipGroupService.countUsers(where),
                this.internshipGroupService.findAllUsers(where, skip, limit)
            ]);

            return {
                total,
                page,
                limit,
                totalPage: Math.ceil(total / limit),
                items,
                message: ['SV_NOTICE_USER_LIST_FETCHED'],
                description: 'Lấy danh sách user thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_GET_USER_LIST_FAILED'],
                description: 'Không thể lấy danh sách user'
            }, 500);
        }
    }

    @Get('students')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy danh sách student (USER ONLY)',
        description: `API lấy danh sách student:
        - Có phân trang
        - Tìm kiếm theo email hoặc tên
        - Nếu có groupId: Chỉ owner/moderator của nhóm mới xem được và lọc student chưa có trong nhóm đó
        - Sắp xếp theo ID giảm dần`
    })
    async findAllStudents(
        @Query() filter: StudentFilterDto,
        @Request() req
    ) {
        try {
            // Nếu có groupId thì kiểm tra quyền truy cập
            if (filter.groupId) {
                const hasAccess = await this.internshipGroupService.hasGroupAccess(+filter.groupId, req.user.id);
                if (!hasAccess) {
                    throw new HttpException({
                        message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                        description: 'Bạn không có quyền thực hiện hành động này'
                    }, 403);
                }
            }

            const page = +(filter.page || 1);
            const limit = +(filter.limit || 10);
            const skip = (page - 1) * limit;

            const where: any = {};

            if (filter.search) {
                where.OR = [
                    { email: { contains: filter.search } },
                    { fullName: { contains: filter.search } }
                ];
            }

            if (filter.groupId) {
                where.NOT = {
                    internshipGroupStudent: {
                        some: {
                            internshipGroupId: +filter.groupId
                        }
                    }
                };
            }

            const [total, items] = await Promise.all([
                this.internshipGroupService.countStudents(where),
                this.internshipGroupService.findAllStudents(where, skip, limit)
            ]);

            return {
                total,
                page,
                limit,
                totalPage: Math.ceil(total / limit),
                items,
                message: ['SV_NOTICE_STUDENT_LIST_FETCHED'],
                description: 'Lấy danh sách student thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_GET_STUDENT_LIST_FAILED'],
                description: 'Không thể lấy danh sách student'
            }, 500);
        }
    }

    @Get('my-student-groups')
    @UseGuards(StudentAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy danh sách nhóm của student (STUDENT ONLY)',
        description: `API lấy danh sách nhóm mà student đang tham gia:
        - Có phân trang
        - Tìm kiếm theo tên nhóm hoặc mô tả
        - Lọc theo trạng thái nhóm
        - Sắp xếp theo thời gian tạo mới nhất`
    })
    async findAllByStudent(
        @Query() filter: StudentGroupsFilterDto,
        @Request() req
    ) {
        try {
            const page = +(filter.page || 1);
            const limit = +(filter.limit || 10);
            const skip = (page - 1) * limit;

            const where: any = {};

            if (filter.search) {
                where.OR = [
                    { name: { contains: filter.search } },
                    { description: { contains: filter.search } }
                ];
            }

            if (filter.progress) {
                where.progress = filter.progress;
            }

            const [total, items] = await Promise.all([
                this.internshipGroupService.countByStudent(req.student.id, where),
                this.internshipGroupService.findAllByStudent(req.student.id, where, skip, limit)
            ]);

            return {
                total,
                page,
                limit,
                totalPage: Math.ceil(total / limit),
                items,
                message: ['SV_NOTICE_GROUP_LIST'],
                description: 'Lấy danh sách nhóm thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_GROUP_LIST_FAILED'],
                description: 'Không thể lấy danh sách nhóm'
            }, 500);
        }
    }

    @Get('student-group/:id')
    @UseGuards(StudentAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy chi tiết nhóm (STUDENT ONLY)',
        description: 'API lấy thông tin chi tiết của nhóm mà student đang tham gia, bao gồm danh sách moderator và student.'
    })
    async getStudentGroupDetails(
        @Param('id') id: number,
        @Request() req
    ) {
        try {
            const group = await this.internshipGroupService.findByIdWithDetails(+id);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // Kiểm tra student có trong nhóm không
            const isStudent = await this.internshipGroupService.isGroupStudent(+id, req.student.id);
            if (!isStudent) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_STUDENT'],
                    description: 'Bạn không phải là thành viên của nhóm này'
                }, 403);
            }

            return {
                data: group,
                message: ['SV_NOTICE_GROUP_DETAILS_FETCHED'],
                description: 'Lấy thông tin chi tiết nhóm thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GET_GROUP_DETAILS_FAILED'],
                description: 'Không thể lấy thông tin chi tiết nhóm'
            }, 500);
        }
    }

    @Put(':id/progress')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Chuyển trạng thái nhóm (OWNER/MODERATOR ONLY)',
        description: `API cập nhật trạng thái nhóm. Chỉ cho phép cập nhật 3 trạng thái:
        - WAITING_FOR_MENTOR
        - WAITING_FOR_STUDENT  
        - WAITING_FOR_PROJECT
        Chỉ owner hoặc moderator của nhóm mới có quyền thực hiện.`
    })
    async updateProgress(
        @Param('id') id: number,
        @Body() data: UpdateProgressDto,
        @Request() req
    ) {
        try {
            // Kiểm tra nhóm tồn tại
            const group = await this.internshipGroupService.findById(+id);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // Kiểm tra quyền truy cập
            const hasAccess = await this.internshipGroupService.hasGroupAccess(+id, req.user.id);
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            // Kiểm tra progress có phải là một trong 3 trạng thái cho phép không
            if (!['WAITING_FOR_MENTOR', 'WAITING_FOR_STUDENT', 'WAITING_FOR_PROJECT'].includes(data.progress)) {
                throw new HttpException({
                    message: ['SV_ERR_PROGRESS_NOT_ALLOWED'],
                    description: 'Không thể chuyển sang trạng thái này'
                }, 400);
            }

            const updated = await this.internshipGroupService.updateProgress(+id, data.progress);

            return {
                data: updated,
                message: ['SV_NOTICE_GROUP_PROGRESS_UPDATED'],
                description: 'Cập nhật trạng thái nhóm thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_UPDATE_GROUP_PROGRESS_FAILED'],
                description: 'Không thể cập nhật trạng thái nhóm'
            }, 500);
        }
    }

    @Delete(':id')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Xóa nhóm thực tập (MASTER/OWNER ONLY)',
        description: `API xóa nhóm thực tập với các điều kiện:
        - Chỉ MASTER hoặc OWNER của nhóm mới có quyền xóa
        - Nhóm chưa có moderator nào
        - Nhóm chưa có student nào
        - Nhóm chưa được gán project nào`
    })
    async delete(
        @Param('id') id: number,
        @Request() req
    ) {
        try {
            // Kiểm tra nhóm tồn tại
            const group = await this.internshipGroupService.findById(+id);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            // Kiểm tra quyền xóa (MASTER hoặc OWNER)
            const isMaster = req.user.role === 'MASTER';
            const isOwner = group.ownerId === req.user.id;
            
            if (!isMaster && !isOwner) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_DELETE_PERMISSION'],
                    description: 'Bạn không có quyền xóa nhóm này'
                }, 403);
            }

            // Kiểm tra điều kiện xóa
            const canDelete = await this.internshipGroupService.canDeleteGroup(+id);
            if (!canDelete) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_CANNOT_DELETE'],
                    description: 'Không thể xóa nhóm đã có thành viên hoặc đã được gán project'
                }, 400);
            }

            await this.internshipGroupService.deleteGroup(+id);

            return {
                message: ['SV_NOTICE_GROUP_DELETED'],
                description: 'Xóa nhóm thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GROUP_DELETE_FAILED'],
                description: 'Không thể xóa nhóm'
            }, 500);
        }
    }
}
