import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { UserFilterDto } from './dto/user-filter.dto';
import { StringUtil } from 'src/utils/string.util';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaProvider) {}

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email }
        });
    }

    async findById(id: number) {
        return this.prisma.user.findUnique({
            where: { id }
        });
    }

    async findAll(filter: UserFilterDto) {
        let { page = 1, limit = 10, search, role, status } = filter;
        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: any = {};
        
        if (search) {
            const normalizedSearch = StringUtil.normalizeSearchText(search);
            where.OR = [
                { email: { contains: normalizedSearch } },
                { fullName: { contains: normalizedSearch } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (status) {
            where.status = status;
        }

        // Get total count for pagination
        const total = await this.prisma.user.count({ where });
        
        // Get users with pagination
        const users = await this.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        return {
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async create(data: CreateUserDto) {
        return this.prisma.user.create({
            data: {
                ...data,
                password: hashSync(data.password, 10)
            }
        });
    }

    async updateStatus(id: number, status: UserStatus) {
        return this.prisma.user.update({
            where: { id },
            data: { status }
        });
    }

    async update(id: number, data: UpdateUserDto) {
        const updateData: any = { ...data };
        if (data.password) {
            updateData.password = hashSync(data.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData
        });
    }
}
