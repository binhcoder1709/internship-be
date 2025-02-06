import { Body, Controller, Post, HttpException, UseGuards, Get, Request, Headers, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { UserLoginDto } from './dto/user-login.dto';
import { compare } from 'bcrypt';
import { JwtProvider } from 'src/providers/local/jwt.provider';
import { RedisProvider } from 'src/providers/local/redis.provider';
import { UserAuthGuard } from 'src/guards/user-auth.guard';

@ApiTags('User Authentication')
@Controller('user-auth')
export class UserAuthController {
    constructor(
        private readonly userService: UserService,
        private readonly jwt: JwtProvider,
        private readonly redis: RedisProvider
    ) {}

    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập tài khoản người dùng' })
    @ApiResponse({ 
        status: 200, 
        description: 'Đăng nhập thành công',
        schema: {
            example: {
                message: ['SV_NOTICE_LOGIN_SUCCESS'],
                description: 'Đăng nhập thành công',
                data: {
                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
            }
        }
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Lỗi đăng nhập',
        schema: {
            example: {
                message: ['SV_ERR_INVALID_CREDENTIALS'],
                description: 'Email hoặc mật khẩu không chính xác'
            }
        }
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Tài khoản bị khóa',
        schema: {
            example: {
                message: ['SV_ERR_ACCOUNT_INACTIVE'],
                description: 'Tài khoản đã bị khóa'
            }
        }
    })
    async login(@Body() data: UserLoginDto) {
        const user = await this.userService.findByEmail(data.email);
        
        if (!user) {
            throw new HttpException({
                message: ['SV_ERR_INVALID_CREDENTIALS'],
                description: 'Email hoặc mật khẩu không chính xác'
            }, 400);
        }

        // Kiểm tra trạng thái tài khoản
        if (user.status === 'INACTIVE') {
            throw new HttpException({
                message: ['SV_ERR_ACCOUNT_INACTIVE'],
                description: 'Tài khoản đã bị khóa'
            }, 401);
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new HttpException({
                message: ['SV_ERR_INVALID_CREDENTIALS'],
                description: 'Email hoặc mật khẩu không chính xác'
            }, 400);
        }

        // Tạo JWT token
        const token = this.jwt.sign({ 
            id: user.id,
            email: user.email,
            role: user.role
        }, '30d');

        // Lưu token vào Redis
        await this.redis.setWithExpiry(`user_token:${user.id}`, token, 86400 * 30); // 24h

        return {
            message: ['SV_NOTICE_LOGIN_SUCCESS'],
            description: 'Đăng nhập thành công',
            data: { token }
        };
    }

    @Get('me')
    @ApiBearerAuth('access-token')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Lấy thông tin người dùng từ token',
        description: 'Lấy thông tin chi tiết của người dùng dựa vào token JWT'
    })
    @ApiResponse({ 
        status: 200,
        description: 'Lấy thông tin thành công',
        schema: {
            example: {
                id: 1,
                email: "mentor@example.com",
                fullName: "Nguyễn Văn Mentor",
                status: "ACTIVE"
            }
        }
    })
    async getMe(@Request() req, @Headers('authorization') auth: string) {
        const user = await this.userService.findById(req.user.id);
        
        if (!user) {
            throw new HttpException({
                message: ['SV_ERR_NOT_FOUND'],
                description: 'Không tìm thấy thông tin người dùng'
            }, 404);
        }

        return user;
    }
}
