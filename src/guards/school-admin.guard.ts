import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { JwtProvider } from 'src/providers/local/jwt.provider';
import { RedisProvider } from 'src/providers/local/redis.provider';

interface JwtSchoolAdminPayload {
    id: number;
    email: string;
    type: string;
}

@Injectable()
export class SchoolAdminAuthGuard implements CanActivate {
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
            const decoded = this.jwt.verify(token) as JwtSchoolAdminPayload;
            
            // Kiểm tra type token
            if (decoded.type !== 'school_admin') {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_TOKEN_TYPE'],
                    description: 'Loại token không hợp lệ'
                }, 401);
            }

            // Check if token exists in Redis with school_admin prefix
            const storedToken = await this.redis.get(`school_admin:token:${decoded.id}`);
            if (!storedToken || storedToken !== token) {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_TOKEN'],
                    description: 'Token không hợp lệ hoặc đã hết hạn'
                }, 401);
            }

            request.schoolAdmin = decoded;
            return true;
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INVALID_TOKEN'],
                description: 'Token không hợp lệ hoặc đã hết hạn'
            }, 401);
        }
    }
} 