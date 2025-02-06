import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';
import { StringUtil } from 'src/utils/string.util';

@Injectable()
export class StudentService {
    constructor(private readonly prisma: PrismaProvider) {}

    async create(data: CreateStudentDto) {
        return this.prisma.student.create({ 
            data: {
                ...data,
                avatar: "/images/default/default_student_avatar.png"
            }
         });
    }

    async update(id: number, data: UpdateStudentDto) {
        return this.prisma.student.update({
            where: { id: +id },
            data
        });
    }

    async delete(id: number) {
        return this.prisma.student.update({
            where: { id: +id },
            data: { status: 'INACTIVE' }
        });
    }

    async findById(id: number) {
        return this.prisma.student.findFirst({
            where: { 
                id: +id
            },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }

    async findAll(filter: StudentFilterDto) {
        let { page = 1, limit = 10, search, schoolId, status, gender } = filter;
        page = +page;
        limit = +limit;
        const skip = (page - 1) * limit;

        const where: any = {};
        
        if (search) {
            const normalizedSearch = StringUtil.normalizeSearchText(search);
            where.OR = [
                { email: { contains: normalizedSearch } },
                { phoneNumber: { contains: normalizedSearch } },
                { fullName: { contains: normalizedSearch } }
            ];
        }

        if (schoolId) {
            where.schoolId = +schoolId;
        }

        if (status) {
            where.status = status;
        }

        if (gender) {
            where.gender = gender;
        }

        const total = await this.prisma.student.count({ where });
        
        const students = await this.prisma.student.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return {
            data: students,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findByEmail(email: string) {
        return this.prisma.student.findUnique({
            where: { email },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }

    async register(data: CreateStudentDto) {
        return this.prisma.student.create({
            data: {
                ...data,
                createdAt: new Date()
            }
        });
    }

    async verifyEmail(email: string, verifyAt: Date) {
        return this.prisma.student.update({
            where: { email },
            data: { 
                verifyAt,
                status: 'ACTIVE'
            }
        });
    }

    async updateAvatar(id: number, avatarPath: string) {
        return this.prisma.student.update({
            where: { id: +id },
            data: { avatar: avatarPath }
        });
    }

    async findSchoolById(id: number) {
        return this.prisma.school.findUnique({
            where: { 
                id: +id,
                deletedAt: null
            }
        });
    }
}