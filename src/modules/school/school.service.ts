import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SchoolFilterDto } from './dto/school-filter.dto';
import { StringUtil } from 'src/utils/string.util';
import { UpdateSchoolAdminDto } from './dto/update-school-admin.dto';
import { SchoolStudentFilterDto } from './dto/school-student-filter.dto';
import { SchoolAdminFilterDto } from './dto/school-admin-filter.dto';
import { UnassignedStudentFilterDto } from './dto/unassigned-student-filter.dto';
import { SchoolAssignmentStatus } from './dto/unassigned-student-filter.dto';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class SchoolService {
    constructor(private readonly prisma: PrismaProvider) {}

    async create(data: CreateSchoolDto) {
        return this.prisma.school.create({ data });
    }

    async update(id: number, data: UpdateSchoolDto) {
        return this.prisma.school.update({
            where: { id: +id },
            data
        });
    }

    async delete(id: number) {
        const now = new Date();
        return this.prisma.school.update({
            where: { id: +id },
            data: { deletedAt: now }
        });
    }

    async findById(id: number) {
        return this.prisma.school.findFirst({
            where: { 
                id: +id,
                deletedAt: null
            }
        });
    }

    async findAll(filter: SchoolFilterDto) {
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
                { address: { contains: normalizedSearch } }
            ];
        }

        const total = await this.prisma.school.count({ where });
        
        const schools = await this.prisma.school.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                name: 'asc'
            }
        });

        return {
            data: schools,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findAdminByEmail(email: string) {
        return this.prisma.schoolAdmin.findUnique({
            where: { email }
        });
    }

    async findAdminById(id: number) {
        return this.prisma.schoolAdmin.findUnique({
            where: { id: +id }
        });
    }

    async createSchoolAdmin(data: any) {
        return this.prisma.schoolAdmin.create({
            data,
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

    async updateSchoolAdmin(id: number, data: UpdateSchoolAdminDto) {
        return this.prisma.schoolAdmin.update({
            where: { id: +id },
            data,
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

    async findStudents(schoolId: number, filter: SchoolStudentFilterDto) {
        let { page = 1, limit = 10, search } = filter;
        page = +page;
        limit = +limit;
        const skip = (page - 1) * limit;

        const where: any = {
            schoolId: +schoolId
        };
        
        if (search) {
            const normalizedSearch = StringUtil.normalizeSearchText(search);
            where.OR = [
                { fullName: { contains: normalizedSearch } },
                { email: { contains: normalizedSearch } },
                { phoneNumber: { contains: normalizedSearch } }
            ];
        }

        const total = await this.prisma.student.count({ where });
        
        const students = await this.prisma.student.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                fullName: true,
                status: true,
                avatar: true,
                gender: true,
                birthday: true
            },
            orderBy: {
                fullName: 'asc'
            }
        });

        return {
            data: students,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async addStudents(schoolId: number, studentIds: number[]) {
        return this.prisma.$transaction(
            studentIds.map(studentId =>
                this.prisma.student.update({
                    where: { id: +studentId },
                    data: { schoolId: +schoolId }
                })
            )
        );
    }

    async removeStudentFromSchool(schoolId: number, studentId: number) {
        return this.prisma.student.update({
            where: { 
                id: +studentId,
                schoolId: +schoolId // Đảm bảo student thuộc trường này
            },
            data: { schoolId: null }
        });
    }

    async findAllAdmins(filter: SchoolAdminFilterDto) {
        const { page = '1', limit = '10', search, status, schoolId } = filter;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search } },
                { fullName: { contains: search } },
                { phoneNumber: { contains: search } },
                { school: { name: { contains: search } } }
            ];
        }

        if (status) {
            where.status = status;
        }

        if (schoolId) {
            where.schoolId = +schoolId;
        }

        const [total, schoolAdmins] = await Promise.all([
            this.prisma.schoolAdmin.count({ where }),
            this.prisma.schoolAdmin.findMany({
                where,
                skip,
                take: +limit,
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
            })
        ]);

        return {
            data: schoolAdmins,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / +limit)
            }
        };
    }

    async findUnassignedStudents(filter: UnassignedStudentFilterDto) {
        const { 
            page = '1', 
            limit = '10', 
            search, 
            status,
            assignmentStatus = SchoolAssignmentStatus.ALL 
        } = filter;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};

        // Lọc theo trạng thái phân công trường
        if (assignmentStatus === SchoolAssignmentStatus.UNASSIGNED) {
            where.schoolId = null;
        } else if (assignmentStatus === SchoolAssignmentStatus.ASSIGNED) {
            where.schoolId = { not: null };
        }

        if (search) {
            const normalizedSearch = StringUtil.normalizeSearchText(search);
            where.OR = [
                { email: { contains: normalizedSearch } },
                { fullName: { contains: normalizedSearch } },
                { phoneNumber: { contains: normalizedSearch } }
            ];
        }

        if (status) {
            where.status = status;
        }

        const [total, students] = await Promise.all([
            this.prisma.student.count({ where }),
            this.prisma.student.findMany({
                where,
                skip,
                take: +limit,
                select: {
                    id: true,
                    email: true,
                    phoneNumber: true,
                    fullName: true,
                    status: true,
                    avatar: true,
                    gender: true,
                    birthday: true,
                    school: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    fullName: 'asc'
                }
            })
        ]);

        return {
            data: students,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / +limit)
            }
        };
    }

    async loadSchoolData() {
        try {
            const filePath = path.join(process.cwd(), 'src/modules/school/data/school.json');
            const fileContent = await fs.readFile(filePath, 'utf8');
            const schoolData = JSON.parse(fileContent);

            if (!schoolData.schools || !Array.isArray(schoolData.schools)) {
                throw new Error('Invalid school data format');
            }

            // Hàm kiểm tra xem một chuỗi có chứa từ "Trường" hoặc các từ khóa liên quan
            const isSchoolName = (text: string): boolean => {
                const schoolKeywords = [
                    'Trường', 'Đại học', 'Học viện', 'Cao đẳng', 
                    'Nhạc viện', 'Viện', 'Phân hiệu'
                ];
                return schoolKeywords.some(keyword => text.includes(keyword));
            };

            // Chuẩn hóa dữ liệu trường học
            const schools = schoolData.schools.map(school => {
                let { name, address } = school;
                
                // Kiểm tra và swap nếu address chứa từ khóa trường và name không chứa
                if (isSchoolName(address) && !isSchoolName(name)) {
                    // Swap name và address
                    [name, address] = [address, name];
                }

                return {
                    name: name.trim(),
                    address: address.trim()
                };
            });

            // Thực hiện insert với prisma
            const result = await this.prisma.$transaction(
                schools.map(school => 
                    this.prisma.school.upsert({
                        where: { name: school.name },
                        create: school,
                        update: school
                    })
                )
            );

            return result;

        } catch (error) {
            console.error('Error loading school data:', error);
            throw error;
        }
    }

    async findByName(name: string) {
        return this.prisma.school.findUnique({
            where: { name }
        });
    }

    async findByIdWithDeleted(id: number) {
        return this.prisma.school.findUnique({
            where: { id: +id }
        });
    }

    async restore(id: number) {
        return this.prisma.school.update({
            where: { id: +id },
            data: { deletedAt: null }
        });
    }

    async overrideSchool(id: number) {
        // Thực hiện trong transaction để đảm bảo tính toàn vẹn
        return this.prisma.$transaction(async (tx) => {
            // Lấy thông tin trường cũ
            const oldSchool = await tx.school.findUnique({
                where: { id: +id }
            });

            // 1. Đổi tên trường cũ bằng cách thêm timestamp
            const updatedOldSchool = await tx.school.update({
                where: { id: +id },
                data: { 
                    name: `${oldSchool.name}_deleted_${Date.now()}`
                }
            });

            // 2. Tạo trường mới với thông tin gốc
            const newSchool = await tx.school.create({
                data: {
                    name: oldSchool.name,
                    address: oldSchool.address
                }
            });

            return {
                oldSchool: updatedOldSchool,
                newSchool
            };
        });
    }
}
