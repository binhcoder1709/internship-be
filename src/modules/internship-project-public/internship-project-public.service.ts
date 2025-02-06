import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { GetProjectsDto } from './dto/get-projects.dto';

@Injectable()
export class InternshipProjectPublicService {
    constructor(private readonly prisma: PrismaProvider) {}

    async findAll(filter: GetProjectsDto) {
        const { page = 1, limit = 10, search } = filter;
        const skip = (+page - 1) * +limit;

        // Build where condition
        const where: any = {
            deletedAt: null
        };

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } }
            ];
        }

        // Get total count
        const total = await this.prisma.internshipProject.count({ where });

        // Get data with pagination
        const data = await this.prisma.internshipProject.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                duration: true,
                memberCount: true
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
