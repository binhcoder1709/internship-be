import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtProvider } from 'src/providers/local/jwt.provider';
import { RedisProvider } from 'src/providers/local/redis.provider';

interface JwtStudentPayload {
    id: number;
    email: string;
}

@Injectable()
export class StudentWsGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtProvider,
        private readonly redis: RedisProvider
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client = context.switchToWs().getClient();
        const auth = client.handshake.auth.token || client.handshake.headers.authorization || client.handshake.query.token;

        try {
   
            if (!auth) {
                client.emit('error', {
                    message: ['SV_ERR_TOKEN_REQUIRED'],
                    description: 'Token là bắt buộc'
                });
                client.disconnect();
                return false;
            }
     
            const token = auth.replace('Bearer ', '').replaceAll('"', '');
            // Verify JWT token
            const decoded = this.jwt.verify(token) as JwtStudentPayload;
        
            // Check if token exists in Redis   
            const storedToken = await this.redis.get(`token:${decoded.id}`);
            if (!storedToken || storedToken !== token) {
                client.emit('error', {
                    message: ['SV_ERR_INVALID_TOKEN'],
                    description: 'Token không hợp lệ hoặc đã hết hạn'
                });
                client.disconnect();
                return false;
            }
   
            // Gán thông tin student vào client để sử dụng sau này
            client.data = { student: decoded };
            return true;

        } catch (error) {
            client.emit('error', {
                message: ['SV_ERR_INVALID_TOKEN'],
                description: 'Token không hợp lệ hoặc đã hết hạn'
            });
            client.disconnect();
            return false;
        }
    }
} 