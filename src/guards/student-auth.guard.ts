import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { JwtProvider } from 'src/providers/local/jwt.provider';
import { RedisProvider } from 'src/providers/local/redis.provider';

interface JwtStudentPayload {
    id: number;
    email: string;
}

@Injectable()
export class StudentAuthGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtProvider,
        private readonly redis: RedisProvider
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const auth = request.headers.authorization;

        if (!auth) {
            throw new HttpException({
                message: ['SV_ERR_TOKEN_REQUIRED'],
                description: 'Token là bắt buộc'
            }, 401);
        }

        const token = auth.replace('Bearer ', '');

        try {
            // Verify JWT token
            const decoded = this.jwt.verify(token) as JwtStudentPayload;
            // Check if token exists in Redis   
            const storedToken = await this.redis.get(`token:${decoded.id}`);
            if (!storedToken || storedToken !== token) {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_TOKEN'],
                    description: 'Token không hợp lệ hoặc đã hết hạn'
                }, 401);
            }

            // Gán thông tin student vào request để sử dụng ở controller
            request.student = decoded;
            return true;
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INVALID_TOKEN'],
                description: 'Token không hợp lệ hoặc đã hết hạn'
            }, 401);
        }
    }
} 