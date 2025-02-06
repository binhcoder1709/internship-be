import { Injectable, HttpException } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { StudentFilterDto } from './dto/student-filter.dto';
import { StringUtil } from 'src/utils/string.util';

interface TrainingStats {
    status: string;
    type: string;
    count: bigint;
    avgCompletionRate: number;
}

@Injectable()
export class SchoolAdminService {
    constructor(
        private readonly prisma: PrismaProvider
    ) {}

    async findById(id: number) {
        return this.prisma.schoolAdmin.findFirst({
            where: { 
                id: +id,
                deletedAt: null,
                status: 'ACTIVE'
            },
            include: {
                school: true
            }
        });
    }

    async getStudents(schoolId: number, filter: StudentFilterDto) {
        let { page = 1, limit = 10, search, status } = filter;
        page = +page;
        limit = +limit;
        const skip = (page - 1) * limit;

        // Xây dựng điều kiện tìm kiếm
        const where: any = {
            schoolId: +schoolId
        };

        if (status) {
            where.status = status;
        }

        if (search) {
            const normalizedSearch = StringUtil.normalizeSearchText(search);
            where.OR = [
                { fullName: { contains: normalizedSearch } },
                { email: { contains: normalizedSearch } },
                { phoneNumber: { contains: normalizedSearch } }
            ];
        }

        // Đếm tổng số student thỏa mãn điều kiện
        const total = await this.prisma.student.count({ where });

        // Lấy danh sách student
        const students = await this.prisma.student.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                fullName: 'asc'
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phoneNumber: true,
                birthday: true,
                gender: true,
                avatar: true,
                status: true,
                verifyAt: true,
                createdAt: true,
                address: true,
                bio: true,
                internshipApplicationList: {
                    select: {
                        id: true,
                        type: true,
                        progress: true,
                        internshipPosition: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    where: {
                        cancelAt: null,
                        rejectAt: null
                    }
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
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

    async getStudentDetail(studentId: number, schoolId: number) {
        // Kiểm tra student có thuộc trường không
        const student = await this.prisma.student.findFirst({
            where: {
                id: +studentId,
                schoolId: +schoolId
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phoneNumber: true,
                birthday: true,
                gender: true,
                avatar: true,
                status: true,
                verifyAt: true,
                createdAt: true,
                address: true,
                bio: true,
                // Thông tin trường học
                school: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                },
                // Danh sách đơn đăng ký thực tập
                internshipApplicationList: {
                    select: {
                        id: true,
                        type: true,
                        progress: true,
                        address: true,
                        cancelAt: true,
                        cancelReason: true,
                        rejectAt: true,
                        rejectReason: true,
                        createAt: true,
                        acceptedAt: true,
                        interviewedAt: true,
                        groupedAt: true,
                        interviewLink: true,
                        interviewTime: true,
                        interviewNote: true,
                        interviewResult: true,
                        internshipPosition: {
                            select: {
                                id: true,
                                name: true,
                                description: true
                            }
                        },
                        internshipGroup: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                progress: true,
                                startAt: true,
                                finishAt: true
                            }
                        }
                    }
                },
                // Danh sách nhóm thực tập
                internshipGroupStudent: {
                    select: {
                        createdAt: true,
                        internshipGroup: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                progress: true,
                                startAt: true,
                                finishAt: true,
                                internshipProject: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        duration: true,
                                        srsTemplateUrl: true,
                                        taskListUrl: true,
                                        uiDesignUrl: true,
                                        databaseDesignUrl: true,
                                        projectStructureUrl: true,
                                        projectPlanUrl: true
                                    }
                                }
                            }
                        }
                    }
                },
                // Danh sách task trong nhóm
                internshipGroupTask: {
                    select: {
                        id: true,
                        createAt: true,
                        startDate: true,
                        finishDate: true,
                        progress: true,
                        regulations: true,
                        mentorCommand: true,
                        taskName: true,
                        taskDetailMorning: true,
                        taskDetailAfternoon: true,
                        internshipGroup: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        // Thông tin bài tập training
                        interviewTrainingTask: {
                            select: {
                                id: true,
                                status: true,
                                type: true,
                                isLate: true,
                                createdAt: true,
                                updatedAt: true,
                                examSet: {
                                    select: {
                                        id: true,
                                        title: true,
                                        description: true,
                                        type: true,
                                        timeLimit: true
                                    }
                                },
                                examAttempt: {
                                    select: {
                                        id: true,
                                        startTime: true,
                                        endTime: true,
                                        completionRate: true,
                                        note: true,
                                        submissions: {
                                            select: {
                                                id: true,
                                                answer: true,
                                                result: true,
                                                isCorrect: true,
                                                submittedAt: true,
                                                question: {
                                                    select: {
                                                        id: true,
                                                        type: true,
                                                        questionText: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                // Danh sách bài thi
                examAttempts: {
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true,
                        completionRate: true,
                        note: true,
                        examSet: {
                            select: {
                                id: true,
                                title: true,
                                description: true,
                                type: true,
                                timeLimit: true
                            }
                        },
                        submissions: {
                            select: {
                                id: true,
                                answer: true,
                                result: true,
                                isCorrect: true,
                                submittedAt: true,
                                question: {
                                    select: {
                                        id: true,
                                        type: true,
                                        questionText: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!student) return null;

        return student;
    }

    async getStudentStatistics(schoolId: number) {
        // 1. Thống kê tổng quan
        const overview = await this.prisma.student.groupBy({
            by: ['status'],
            where: {
                schoolId: +schoolId
            },
            _count: true
        });

        // 2. Thống kê theo đơn đăng ký thực tập
        const internshipStats = await this.prisma.internshipApplication.groupBy({
            by: ['progress'],
            where: {
                student: {
                    schoolId: +schoolId
                }
            },
            _count: true
        });

        // 3. Thống kê task thực tập
        const taskStats = await this.prisma.internshipGroupTask.groupBy({
            by: ['progress'],
            where: {
                student: {
                    schoolId: +schoolId
                }
            },
            _count: true
        });

        // 4. Thống kê bài tập training
        const trainingStats = await this.prisma.$queryRaw`
            SELECT 
                status,
                type,
                COUNT(*) as count,
                AVG(CASE WHEN examAttempt.completionRate IS NOT NULL 
                    THEN examAttempt.completionRate 
                    ELSE 0 
                END) as avgCompletionRate
            FROM InterviewTrainingTask
            LEFT JOIN Student ON Student.id = InterviewTrainingTask.studentId
            LEFT JOIN ExamAttempt ON ExamAttempt.id = InterviewTrainingTask.examAttemptId
            WHERE Student.schoolId = ${schoolId}
            GROUP BY status, type
        `;

        return {
            overview: {
                total: overview.reduce((acc, curr) => acc + curr._count, 0),
                byStatus: overview.reduce((acc, curr) => ({
                    ...acc,
                    [curr.status]: curr._count
                }), {})
            },
            internshipApplications: {
                total: internshipStats.reduce((acc, curr) => acc + curr._count, 0),
                byProgress: internshipStats.reduce((acc, curr) => ({
                    ...acc,
                    [curr.progress]: curr._count
                }), {})
            },
            tasks: {
                total: taskStats.reduce((acc, curr) => acc + curr._count, 0),
                byProgress: taskStats.reduce((acc, curr) => ({
                    ...acc,
                    [curr.progress]: curr._count
                }), {})
            },
            training: {
                byType: (trainingStats as any[]).reduce((acc, curr) => ({
                    ...acc,
                    [curr.type]: {
                        total: curr._count,
                        avgCompletionRate: curr._avg?.examAttempt?.completionRate || 0,
                        finished: curr.status === 'FINISHED' ? curr._count : 0,
                        unfinished: curr.status === 'UNFINISHED' ? curr._count : 0
                    }
                }), {})
            }
        };
    }
}