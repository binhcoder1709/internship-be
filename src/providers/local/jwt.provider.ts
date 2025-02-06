import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken'

@Injectable()
export class JwtProvider {
    private readonly secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key';

    constructor() {}

    sign(payload: any, expiresIn: string = '24h') {
        return jwt.sign(payload, this.secretKey, { expiresIn });
    }

    verify(token: string) {
        return jwt.verify(token, this.secretKey);
    }
}