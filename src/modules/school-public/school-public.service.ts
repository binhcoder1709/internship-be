import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { SchoolPublicFilterDto } from './dto/school-public-filter.dto';
import { StringUtil } from 'src/utils/string.util';

@Injectable()
export class SchoolPublicService {
    constructor(private readonly prisma: PrismaProvider) {}

    async findAll(filter: SchoolPublicFilterDto) {
        let { page = 1, limit = 10, search } = filter;
        page = +page;
        limit = +limit;
        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null
        };

        if (search) {
            where.OR = [
                { name: { contains: StringUtil.normalizeSearchText(search) } },
                { address: { contains: StringUtil.normalizeSearchText(search) } }
            ];
        }

        const [total, schools] = await Promise.all([
            this.prisma.school.count({ where }),
            this.prisma.school.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    name: 'asc'
                },
                select: {
                    id: true,
                    name: true,
                    address: true,
                    _count: {
                        select: {
                            studentList: true
                        }
                    }
                }
            })
        ]);

        return {
            data: schools.map(school => ({
                ...school,
                studentCount: school._count.studentList
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
