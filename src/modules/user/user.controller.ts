import { Body, Controller, Get, HttpException, Param, Post, Put, Request, UseGuards, Headers, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserAuthGuard } from 'src/guards/user-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from '@prisma/client';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';
import { UserFilterDto } from './dto/user-filter.dto';

@ApiTags('User Management')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('list')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: 'Lấy danh sách người dùng (Master only)' })
    @ApiResponse({ 
        status: 200,
        description: 'Lấy danh sách thành công',
        schema: {
            example: {
                data: [{
                    id: 1,
                    email: "mentor@example.com",
                    fullName: "Nguyễn Văn Mentor",
                    role: "LECTURE",
                    status: "ACTIVE",
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
    @ApiResponse({ 
        status: 403,
        description: 'Không có quyền truy cập',
        schema: {
            example: {
                message: ['SV_ERR_UNAUTHORIZED'],
                description: 'Không có quyền truy cập'
            }
        }
    })
    async getList(@Request() req, @Query() filter: UserFilterDto, @Headers('authorization') auth: string) {
        try {
            return this.userService.findAll(filter);
        } catch (error) {
            //console.log("error", error);
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER_ERROR'],
                description: 'Lỗi server'
            }, 500);
        }
    }

    @Post('create')
    @ApiBearerAuth("access-token")
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo tài khoản người dùng mới (Master only)' })
    @ApiBody({
        type: CreateUserDto,
        description: 'Thông tin tạo tài khoản mới',
        schema: {
            example: {
                email: "mentor@example.com",
                password: "123456",
                fullName: "Nguyễn Văn Mentor",
                role: "LECTURE"
            }
        }
    })
    @ApiResponse({ 
        status: 201,
        description: 'Tạo tài khoản thành công',
        schema: {
            example: {
                message: ['SV_NOTICE_USER_CREATED'],
                description: 'Tạo tài khoản thành công'
            }
        }
    })
    @ApiResponse({ 
        status: 400,
        description: 'Email đã tồn tại',
        schema: {
            example: {
                message: ['SV_ERR_DUPLICATE_EMAIL'],
                description: 'Email đã tồn tại'
            }
        }
    })
    @ApiResponse({ 
        status: 403,
        description: 'Không có quyền truy cập',
        schema: {
            example: {
                message: ['SV_ERR_UNAUTHORIZED'],
                description: 'Không có quyền truy cập'
            }
        }
    })
    async create(@Request() req, @Body() data: CreateUserDto, @Headers('authorization') auth: string) {
        if (req.user.role !== 'MASTER') {
            throw new HttpException({
                message: ['SV_ERR_UNAUTHORIZED'],
                description: 'Không có quyền truy cập'
            }, 403);
        }

        const existingUser = await this.userService.findByEmail(data.email);
        if (existingUser) {
            throw new HttpException({
                message: ['SV_ERR_DUPLICATE_EMAIL'],
                description: 'Email đã tồn tại'
            }, 400);
        }

        await this.userService.create(data);
        return {
            message: ['SV_NOTICE_USER_CREATED'],
            description: 'Tạo tài khoản thành công'
        };
    }

    @Post(':id/status')
    @ApiBearerAuth("access-token")
    @UseGuards(MasterAuthGuard)
    @ApiOperation({ summary: 'Cập nhật trạng thái người dùng (Master only)' })
    @ApiParam({
        name: 'id',
        type: 'number',
        description: 'ID của người dùng',
        example: 1
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['status'],
            properties: {
                status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE'],
                    example: 'INACTIVE',
                    description: 'Trạng thái mới của người dùng'
                }
            }
        }
    })
    @ApiResponse({ 
        status: 200,
        description: 'Cập nhật trạng thái thành công',
        schema: {
            example: {
                message: ['SV_NOTICE_USER_UPDATED'],
                description: 'Cập nhật trạng thái thành công'
            }
        }
    })
    @ApiResponse({ 
        status: 403,
        description: 'Không có quyền truy cập',
        schema: {
            example: {
                message: ['SV_ERR_UNAUTHORIZED'],
                description: 'Không có quyền truy cập'
            }
        }
    })
    @ApiResponse({ 
        status: 404,
        description: 'Không tìm thấy người dùng',
        schema: {
            example: {
                message: ['SV_ERR_USER_NOT_FOUND'],
                description: 'Không tìm thấy thông tin người dùng'
            }
        }
    })
    async updateStatus(
        @Request() req,
        @Param('id') id: number,
        @Body('status') status: UserStatus,
        @Headers('authorization') auth: string
    ) {
        if (req.user.id === +id) {
            throw new HttpException({
                message: ['SV_ERR_CANNOT_UPDATE_SELF_STATUS'],
                description: 'Không thể cập nhật trạng thái của chính mình'
            }, 400);
        }

        const user = await this.userService.findById(+id);
        if (!user) {
            throw new HttpException({
                message: ['SV_ERR_USER_NOT_FOUND'],
                description: 'Không tìm thấy thông tin người dùng'
            }, 404);
        }

        await this.userService.updateStatus(+id, status);
        return {
            message: ['SV_NOTICE_USER_UPDATED'],
            description: 'Cập nhật trạng thái thành công'
        };
    }

    @Put('profile')
    @ApiBearerAuth("access-token")
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật thông tin tài khoản' })
    @ApiBody({
        type: UpdateUserDto,
        description: 'Thông tin cập nhật',
        schema: {
            example: {
                fullName: "Nguyễn Văn A",
                password: "newpassword123"
            }
        }
    })
    @ApiResponse({ 
        status: 200,
        description: 'Cập nhật thông tin thành công',
        schema: {
            example: {
                message: ['SV_NOTICE_PROFILE_UPDATED'],
                description: 'Cập nhật thông tin thành công'
            }
        }
    })
    @ApiResponse({ 
        status: 404,
        description: 'Không tìm thấy người dùng',
        schema: {
            example: {
                message: ['SV_ERR_USER_NOT_FOUND'],
                description: 'Không tìm thấy thông tin người dùng'
            }
        }
    })
    async updateProfile(@Request() req, @Body() data: UpdateUserDto, @Headers('authorization') auth: string) {
        const user = await this.userService.findById(req.user.id);
        if (!user) {
            throw new HttpException({
                message: ['SV_ERR_USER_NOT_FOUND'],
                description: 'Không tìm thấy thông tin người dùng'
            }, 404);
        }

        await this.userService.update(req.user.id, data);
        return {
            message: ['SV_NOTICE_PROFILE_UPDATED'],
            description: 'Cập nhật thông tin thành công'
        };
    }
}
