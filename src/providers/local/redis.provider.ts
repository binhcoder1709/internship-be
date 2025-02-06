import { Injectable, OnModuleInit } from "@nestjs/common";
import * as redis from 'redis';

@Injectable()
export class RedisProvider implements OnModuleInit {
    private client: any;

    constructor() {
        this.client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.client.on('error', (err) => {
            //console.error('Redis Client Error:', err);
        });
    }

    // Kết nối Redis khi module khởi tạo
    async onModuleInit() {
        try {
            await this.client.connect();
           // console.log('Redis connected successfully');
        } catch (error) {
            //console.error('Redis connection failed:', error);
        }
    }

    async set(key: string, value: string): Promise<boolean> {
        try {
            if (!this.client.isReady) {
                await this.client.connect();
            }
            await this.client.set(key, value);
            return true;
        } catch (error) {
            //console.error('Redis set error:', error);
            return false;
        }
    }

    async get(key: string): Promise<string | null> {
        try {
            if (!this.client.isReady) {
                await this.client.connect();
            }
            const value = await this.client.get(key);
            return value;
        } catch (error) {
            //console.error('Redis get error:', error);
            return null;
        }
    }

    async del(key: string): Promise<boolean> {
        try {
            if (!this.client.isReady) {
                await this.client.connect();
            }
            await this.client.del(key);
            return true;
        } catch (error) {
           // console.error('Redis del error:', error);
            return false;
        }
    }

    async expire(key: string, seconds: number): Promise<boolean> {
        try {
            if (!this.client.isReady) {
                await this.client.connect();
            }
            await this.client.expire(key, seconds);
            return true;
        } catch (error) {
          //  console.error('Redis expire error:', error);
            return false;
        }
    }

    async setWithExpiry(key: string, value: string, seconds: number): Promise<boolean> {
        try {
            if (!this.client.isReady) {
                await this.client.connect();
            }
            // Sử dụng SETEX thay vì SET + EXPIRE riêng lẻ
            await this.client.setEx(key, seconds, value);
            // console.log(`Set key ${key} with value ${value} and expiry ${seconds}s`);
            return true;
        } catch (error) {
           // console.error('Redis setWithExpiry error:', error);
            return false;
        }
    }
}