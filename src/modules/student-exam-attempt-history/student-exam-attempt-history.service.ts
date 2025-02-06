import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { GetExamAttemptHistoryDto } from './dto/get-exam-attempt-history.dto';

@Injectable()
export class StudentExamAttemptHistoryService {
    constructor(private readonly prisma: PrismaProvider) {}

    async getHistory(studentId: number, query: GetExamAttemptHistoryDto) {
        const { page = 1, limit = 10, search, examSetType, sort = 'desc' } = query;
        const skip = (page - 1) * limit;

        // Xây dựng điều kiện tìm kiếm
        const where = {
            studentId: +studentId,
            ...(search && {
                examSet: {
                    OR: [
                        { title: { contains: search } },
                        { description: { contains: search } }
                    ]
                }
            }),
            ...(examSetType && {
                examSet: {
                    type: examSetType
                }
            })
        };

        // Thực hiện truy vấn
        const [total, items] = await Promise.all([
            this.prisma.examAttempt.count({ where }),
            this.prisma.examAttempt.findMany({
                where,
                include: {
                    examSet: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            type: true,
                            timeLimit: true,
                            questionCount: true
                        }
                    },
                    submissions: {
                        include: {
                            question: {
                                select: {
                                    id: true,
                                    type: true,
                                    questionText: true
                                }
                            }
                        }
                    },
                    interviewTrainingTask: {
                        include: {
                            internshipGroupTask: {
                                select: {
                                    id: true,
                                    taskName: true,
                                    internshipGroup: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { startTime: sort }
            })
        ]);

        return {
            total,
            items
        };
    }

    async getExamSetHistory(studentId: number, examSetId: number) {
        // Lấy thông tin bộ đề
        const examSet = await this.prisma.examSet.findUnique({
            where: { id: +examSetId },
            select: {
                id: true,
                title: true,
                description: true,
                type: true,
                timeLimit: true,
                questionCount: true
            }
        });

        if (!examSet) {
            return {
                hasAttempted: false,
                examSet: null,
                attempts: []
            };
        }

        // Lấy tất cả các lần làm bài của student với bộ đề này
        const attempts = await this.prisma.examAttempt.findMany({
            where: {
                studentId: +studentId,
                examSetId: +examSetId
            },
            include: {
                submissions: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                type: true,
                                questionText: true
                            }
                        }
                    }
                },
                interviewTrainingTask: {
                    include: {
                        internshipGroupTask: {
                            select: {
                                id: true,
                                taskName: true,
                                internshipGroup: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        // Tính toán thống kê
        const stats = attempts.length > 0 ? {
            totalAttempts: attempts.length,
            bestScore: Math.max(...attempts.map(a => a.completionRate)),
            averageScore: attempts.reduce((sum, a) => sum + a.completionRate, 0) / attempts.length,
            lastAttemptAt: attempts[0].startTime
        } : null;

        return {
            hasAttempted: attempts.length > 0,
            examSet,
            attempts,
            statistics: stats
        };
    }
}
