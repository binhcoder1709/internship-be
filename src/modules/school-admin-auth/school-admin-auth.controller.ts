import { Body, Controller, HttpException, Post, Get, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolAdminAuthService } from './school-admin-auth.service';
import { JwtProvider } from 'src/providers/local/jwt.provider';
import { RedisProvider } from 'src/providers/local/redis.provider';
import { SchoolAdminLoginDto } from './dto/school-admin-login.dto';
import * as bcrypt from 'bcrypt';
import { SchoolAdminAuthGuard } from 'src/guards/school-admin.guard';

@ApiTags('School Admin Authentication')
@Controller('school-admin-auth')
export class SchoolAdminAuthController {
    constructor(
        private readonly schoolAdminAuthService: SchoolAdminAuthService,
        private readonly jwt: JwtProvider,
        private readonly redis: RedisProvider
    ) {}

    @Post('login')
    @ApiOperation({ 
        summary: 'Đăng nhập tài khoản quản trị viên trường học',
        description: 'API cho phép quản trị viên trường học đăng nhập vào hệ thống'
    })
    async login(@Body() data: SchoolAdminLoginDto) {
        try {
            // 1. Tìm school admin theo email
            const schoolAdmin = await this.schoolAdminAuthService.findByEmail(data.email);
            if (!schoolAdmin) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_ADMIN_NOT_FOUND'],
                    description: 'Không tìm thấy tài khoản'
                }, 404);
            }

            // 2. Kiểm tra mật khẩu
            const isPasswordValid = await bcrypt.compare(data.password, schoolAdmin.password);
            if (!isPasswordValid) {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_PASSWORD'],
                    description: 'Mật khẩu không chính xác'
                }, 401);
            }

            // 3. Tạo JWT token
            const token = this.jwt.sign({
                id: schoolAdmin.id,
                email: schoolAdmin.email,
                type: 'school_admin'
            });

            // 4. Lưu token vào Redis với prefix school_admin
            await this.redis.set(`school_admin:token:${schoolAdmin.id}`, token);

            // 5. Trả về thông tin
            return {
                data: {
                    id: schoolAdmin.id,
                    email: schoolAdmin.email,
                    fullName: schoolAdmin.fullName,
                    phoneNumber: schoolAdmin.phoneNumber,
                    avatar: schoolAdmin.avatar,
                    school: schoolAdmin.school,
                    token
                },
                message: ['SV_NOTICE_LOGIN_SUCCESS'],
                description: 'Đăng nhập thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_LOGIN_FAILED'],
                description: 'Có lỗi xảy ra khi đăng nhập'
            }, 500);
        }
    }

    @Get('me')
    @UseGuards(SchoolAdminAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Lấy thông tin tài khoản',
        description: 'API lấy thông tin tài khoản từ token'
    })
    async getProfile(@Request() req) {
        try {
            const { id } = req.schoolAdmin;
            
            // Lấy thông tin chi tiết từ database
            const schoolAdmin = await this.schoolAdminAuthService.findById(id);
            if (!schoolAdmin) {
                throw new HttpException({
                    message: ['SV_ERR_SCHOOL_ADMIN_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin tài khoản'
                }, 404);
            }

            // Trả về thông tin, loại bỏ password
            const { password, ...profile } = schoolAdmin;
            return {
                data: profile,
                message: ['SV_NOTICE_GET_PROFILE_SUCCESS'],
                description: 'Lấy thông tin tài khoản thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GET_PROFILE_FAILED'],
                description: 'Có lỗi xảy ra khi lấy thông tin tài khoản'
            }, 500);
        }
    }
}
