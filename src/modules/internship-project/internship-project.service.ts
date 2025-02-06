import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { CreateInternshipProjectDto } from './dto/create-internship-project.dto';
import { UpdateInternshipProjectDto } from './dto/update-internship-project.dto';
import { InternshipProjectFilterDto } from './dto/internship-project-filter.dto';
import { StringUtil } from 'src/utils/string.util';

@Injectable()
export class InternshipProjectService {
    constructor(private readonly prisma: PrismaProvider) {}

    async create(data: CreateInternshipProjectDto) {
        if (data.memberCount < 1) {
            throw new Error('Số lượng thành viên phải lớn hơn 0');
        }
        
        return this.prisma.internshipProject.create({ data });
    }

    async update(id: number, data: UpdateInternshipProjectDto) {
        if (data.memberCount !== undefined && data.memberCount < 1) {
            throw new Error('Số lượng thành viên phải lớn hơn 0');
        }

        return this.prisma.internshipProject.update({
            where: { id: +id },
            data
        });
    }

    async delete(id: number) {
        return this.prisma.internshipProject.update({
            where: { id: +id },
            data: { deletedAt: new Date() }
        });
    }

    async findById(id: number) {
        return this.prisma.internshipProject.findFirst({
            where: { 
                id: +id,
                deletedAt: null
            }
        });
    }

    async findAll(filter: InternshipProjectFilterDto) {
        let { page = 1, limit = 10, search } = filter;
        page = +page;
        limit = +limit;
        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null
        };
        
        if (search) {
            const normalizedSearch = StringUtil.normalizeSearchText(search);
            where.OR = [
                { name: { contains: normalizedSearch } },
                { description: { contains: normalizedSearch } }
            ];
        }

        const total = await this.prisma.internshipProject.count({ where });
        
        const projects = await this.prisma.internshipProject.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {
            data: projects,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
