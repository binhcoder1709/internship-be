import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { CreateInternshipPositionDto } from './dto/create-internship-position.dto';
import { UpdateInternshipPositionDto } from './dto/update-internship-position.dto';
import { InternshipPositionFilterDto } from './dto/internship-position-filter.dto';
import { StringUtil } from 'src/utils/string.util';
import { AddPositionRequirementDto } from './dto/add-position-requirement.dto';

@Injectable()
export class InternshipPositionService {
    constructor(private readonly prisma: PrismaProvider) {}

    async create(data: CreateInternshipPositionDto) {
        return this.prisma.internshipPosition.create({ data });
    }

    async update(id: number, data: UpdateInternshipPositionDto) {
        return this.prisma.internshipPosition.update({
            where: { id: +id },
            data
        });
    }

    async delete(id: number) {
        const now = new Date();
        return this.prisma.internshipPosition.update({
            where: { id: +id },
            data: { deletedAt: now }
        });
    }

    async findById(id: number) {
        return this.prisma.internshipPosition.findFirst({
            where: { 
                id: +id,
                deletedAt: null
            },
            include: {
                internshipPositionRequirementList: {
                    include: {
                        examSet: {
                            select: {
                                title: true,
                                description: true
                            }
                        }
                    }
                }
            }
        });
    }

    async findAll(filter: InternshipPositionFilterDto) {
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

        const total = await this.prisma.internshipPosition.count({ where });
        
        const positions = await this.prisma.internshipPosition.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                name: 'asc'
            }
        });

        return {
            data: positions,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async addRequirement(positionId: number, data: AddPositionRequirementDto) {
        return this.prisma.internshipPositionRequirement.create({
            data: {
                internshipPositionId: positionId,
                examSetId: data.examSetId,
                minimumCompletionRate: data.minimumCompletionRate
            },
            include: {
                examSet: {
                    select: {
                        title: true,
                        description: true
                    }
                }
            }
        });
    }

    async removeRequirement(positionId: number, examSetId: number) {
        return this.prisma.internshipPositionRequirement.delete({
            where: {
                internshipPositionId_examSetId: {
                    internshipPositionId: positionId,
                    examSetId: examSetId
                }
            }
        });
    }
}
