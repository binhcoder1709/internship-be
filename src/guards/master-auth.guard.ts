import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { JwtProvider } from 'src/providers/local/jwt.provider';
import { RedisProvider } from 'src/providers/local/redis.provider';

interface JwtUserPayload {
    id: number;
    email: string;
}

@Injectable()
export class MasterAuthGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtProvider,
        private readonly redis: RedisProvider
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const auth = request.headers.authorization;

        if (!auth) {
            throw new HttpException({
                message: ['USER_ERR_TOKEN_REQUIRED'],
                description: 'Token là bắt buộc'
            }, 401);
        }

        const token = auth.replace('Bearer ', '');

        try {
            // Verify JWT token
            const decoded = (this.jwt.verify(token) as JwtUserPayload) as any;

            // Check if token exists in Redis
            const storedToken = await this.redis.get(`user_token:${decoded.id}`);
            if (!storedToken || storedToken !== token) {
                throw new HttpException({
                    message: ['USER_ERR_INVALID_TOKEN'],
                    description: 'Token không hợp lệ hoặc đã hết hạn'
                }, 401);
            }

            if (decoded.role !== 'MASTER') {
                throw new HttpException({
                    message: ['USER_ERR_UNAUTHORIZED'],
                    description: 'Bạn không có quyền truy cập'
                }, 403);
            }

            // Gán thông tin user vào request để sử dụng ở controller
            request.user = decoded;
            return true;
        } catch (error) {
            throw new HttpException({
                message: ['USER_ERR_INVALID_TOKEN'],
                description: 'Token không hợp lệ hoặc đã hết hạn'
            }, 401);
        }
    }
} 