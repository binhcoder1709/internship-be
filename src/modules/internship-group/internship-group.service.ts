import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { InternshipGroupProgress } from '@prisma/client';

@Injectable()
export class InternshipGroupService {
    constructor(private readonly prisma: PrismaProvider) {}

    async create(data: { name: string; description?: string; ownerId: number }) {
        return this.prisma.internshipGroup.create({
            data: {
                name: data.name,
                description: data.description,
                ownerId: +data.ownerId
            }
        });
    }

    async findAll(where: any, skip: number, take: number) {
        return this.prisma.internshipGroup.findMany({
            where,
            skip: +skip,
            take: +take,
            orderBy: { createAt: 'desc' },
            include: {
                owner: true,
                internshipGroupMonderator: {
                    include: {
                        user: true
                    }
                },
                internshipGroupStudent: true,
                internshipProject: true
            }
        });
    }

    async count(where: any) {
        return this.prisma.internshipGroup.count({ where });
    }

    async findById(id: number) {
        return this.prisma.internshipGroup.findUnique({
            where: { id: +id }
        });
    }

    async update(id: number, data: { name: string; description?: string }) {
        return this.prisma.internshipGroup.update({
            where: { id: +id },
            data: {
                name: data.name,
                description: data.description
            }
        });
    }

    async findByName(name: string, excludeId?: number) {
        return this.prisma.internshipGroup.findFirst({
            where: {
                name,
                ...(excludeId ? { NOT: { id: +excludeId } } : {})
            }
        });
    }

    async addModerator(groupId: number, userId: number) {
        return this.prisma.internshipGroupMonderator.create({
            data: {
                internshipGroupId: +groupId,
                userId: +userId
            }
        });
    }

    async removeModerator(groupId: number, userId: number) {
        return this.prisma.internshipGroupMonderator.deleteMany({
            where: {
                internshipGroupId: +groupId,
                userId: +userId
            }
        });
    }

    async isGroupOwner(groupId: number, userId: number) {
        const group = await this.prisma.internshipGroup.findFirst({
            where: {
                id: +groupId,
                ownerId: +userId
            }
        });
        return !!group;
    }

    async findModerator(groupId: number, userId: number) {
        return this.prisma.internshipGroupMonderator.findFirst({
            where: {
                internshipGroupId: +groupId,
                userId: +userId
            }
        });
    }

    async addStudent(groupId: number, studentId: number) {
        return this.prisma.internshipGroupStudent.create({
            data: {
                internshipGroupId: +groupId,
                studentId: +studentId
            }
        });
    }

    async removeStudent(groupId: number, studentId: number) {
        return this.prisma.internshipGroupStudent.deleteMany({
            where: {
                internshipGroupId: +groupId,
                studentId: +studentId
            }
        });
    }

    async findStudent(groupId: number, studentId: number) {
        return this.prisma.internshipGroupStudent.findFirst({
            where: {
                internshipGroupId: +groupId,
                studentId: +studentId
            }
        });
    }

    async findAllByOwner(ownerId: number, where: any, skip: number, take: number) {
        return this.prisma.internshipGroup.findMany({
            where: {
                ...where,
                ownerId: +ownerId
            },
            skip: +skip,
            take: +take,
            orderBy: { createAt: 'desc' }
        });
    }

    async countByOwner(ownerId: number, where: any) {
        return this.prisma.internshipGroup.count({
            where: {
                ...where,
                ownerId: +ownerId
            }
        });
    }

    async findByIdWithDetails(id: number) {
        return this.prisma.internshipGroup.findUnique({
            where: { id: +id },
            include: {
                internshipGroupMonderator: {
                    include: {
                        user: true // include thông tin user của moderator
                    }
                },
                internshipGroupStudent: {
                    include: {
                        student: true // include thông tin của student
                    }
                },
                internshipProject: true
            }
        });
    }

    async findAllUsers(where: any, skip: number, take: number) {
        return this.prisma.user.findMany({
            where,
            skip: +skip,
            take: +take,
            orderBy: { id: 'desc' }
        });
    }

    async countUsers(where: any) {
        return this.prisma.user.count({ where });
    }

    async findAllStudents(where: any, skip: number, take: number) {
        return this.prisma.student.findMany({
            where,
            skip: +skip,
            take: +take,
            orderBy: { id: 'desc' }
        });
    }

    async countStudents(where: any) {
        return this.prisma.student.count({ where });
    }

    async findAllByStudent(studentId: number, where: any, skip: number, take: number) {
        return this.prisma.internshipGroup.findMany({
            where: {
                ...where,
                internshipGroupStudent: {
                    some: {
                        studentId: +studentId
                    }
                }
            },
            skip: +skip,
            take: +take,
            orderBy: { createAt: 'desc' }
        });
    }

    async countByStudent(studentId: number, where: any) {
        return this.prisma.internshipGroup.count({
            where: {
                ...where,
                internshipGroupStudent: {
                    some: {
                        studentId: +studentId
                    }
                }
            }
        });
    }

    async isGroupStudent(groupId: number, studentId: number) {
        const record = await this.prisma.internshipGroupStudent.findFirst({
            where: {
                internshipGroupId: +groupId,
                studentId: +studentId
            }
        });
        return !!record;
    }

    async isGroupModerator(groupId: number, userId: number) {
        const record = await this.prisma.internshipGroupMonderator.findFirst({
            where: {
                internshipGroupId: +groupId,
                userId: +userId
            }
        });
        return !!record;
    }

    async hasGroupAccess(groupId: number, userId: number) {
        // Kiểm tra user có phải owner hoặc moderator không
        const group = await this.findById(+groupId);
        if (!group) return false;

        if (group.ownerId === +userId) return true;
        
        const isModerator = await this.isGroupModerator(+groupId, +userId);
        return isModerator;
    }

    async findAllByOwnerOrModerator(userId: number, where: any, skip: number, take: number) {
        return this.prisma.internshipGroup.findMany({
            where: {
                ...where,
                OR: [
                    { ownerId: +userId },
                    {
                        internshipGroupMonderator: {
                            some: {
                                userId: +userId
                            }
                        }
                    }
                ]
            },
            skip: +skip,
            take: +take,
            orderBy: { createAt: 'desc' }
        });
    }

    async countByOwnerOrModerator(userId: number, where: any) {
        return this.prisma.internshipGroup.count({
            where: {
                ...where,
                OR: [
                    { ownerId: +userId },
                    {
                        internshipGroupMonderator: {
                            some: {
                                userId: +userId
                            }
                        }
                    }
                ]
            }
        });
    }

    async updateProgress(id: number, progress: InternshipGroupProgress) {
        return this.prisma.internshipGroup.update({
            where: { id: +id },
            data: { progress }
        });
    }

    async canDeleteGroup(id: number) {
        const group = await this.prisma.internshipGroup.findUnique({
            where: { id: +id },
            include: {
                internshipGroupMonderator: true,
                internshipGroupStudent: true,
                internshipProject: true
            }
        });

        if (!group) return false;

        // Kiểm tra không có moderator
        if (group.internshipGroupMonderator.length > 0) return false;

        // Kiểm tra không có student
        if (group.internshipGroupStudent.length > 0) return false;

        // Kiểm tra không có project
        if (group.internshipProject) return false;

        return true;
    }

    async deleteGroup(id: number) {
        return this.prisma.internshipGroup.delete({
            where: { id: +id }
        });
    }
}
