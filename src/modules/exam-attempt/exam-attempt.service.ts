import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';

@Injectable()
export class ExamAttemptService {
    constructor(private readonly prisma: PrismaProvider) {}

    async findExamSet(id: number) {
        return this.prisma.examSet.findUnique({
            where: { id: +id }
        });
    }

    async findOngoing(studentId: number, examSetId: number) {
        return this.prisma.examAttempt.findFirst({
            where: {
                studentId: +studentId,
                examSetId: +examSetId,
                endTime: null
            },
            include: {
                examSet: {
                    select: {
                        title: true,
                        description: true,
                        timeLimit: true,
                        questionCount: true
                    }
                }
            }
        });
    }

    async create(data: {
        studentId: number;
        examSetId: number;
        startTime: Date;
    }) {
        return this.prisma.examAttempt.create({
            data,
            include: {
                examSet: {
                    select: {
                        title: true,
                        description: true,
                        timeLimit: true,
                        questionCount: true
                    }
                }
            }
        });
    }

    async findById(id: number) {
        return this.prisma.examAttempt.findUnique({
            where: { id: +id },
            include: {
                examSet: true
            }
        });
    }

    async updateEndTime(id: number, endTime: Date) {
        return this.update(id, { endTime });
    }

    async findQuestionsForAttempt(attemptId: number) {
        return this.prisma.examAttempt.findUnique({
            where: { id: +attemptId },
            include: {
                examSet: {
                    include: {
                        questions: {
                            include: {
                                question: true
                            }
                        }
                    }
                }
            }
        });
    }

    async findQuestionsByIds(questionIds: number[]) {
        return this.prisma.question.findMany({
            where: {
                id: {
                    in: questionIds
                }
            }
        });
    }

    async updateOrderQuestionList(attemptId: number, orderQuestionList: string) {
        return this.prisma.examAttempt.update({
            where: { id: +attemptId },
            data: { orderQuestionList }
        });
    }

    async update(id: number, data: any) {
        return this.prisma.examAttempt.update({
            where: { id: +id },
            data
        });
    }

    async createSubmission(data: {
        attemptId: number;
        questionId: number;
        answer: string;
        submittedAt: Date;
        result: string;
        isCorrect: boolean;
    }) {
        return this.prisma.questionSubmission.create({
            data: {
                attemptId: +data.attemptId,
                questionId: +data.questionId,
                answer: data.answer,
                submittedAt: data.submittedAt,
                result: data.result,
                isCorrect: data.isCorrect
            }
        });
    }

    async findQuestionById(id: number) {
        return this.prisma.question.findUnique({
            where: { id: +id }
        });
    }

    async findSubmissionsByAttemptId(attemptId: number) {
        return this.prisma.questionSubmission.findMany({
            where: {
                attemptId: +attemptId
            },
            orderBy: {
                submittedAt: 'desc'
            }
        });
    }

    async updateAttemptCompletion(attemptId: number, data: {
        endTime: Date;
        completionRate: number;
        note?: string;
    }) {
        return this.prisma.examAttempt.update({
            where: { id: attemptId },
            data: {
                endTime: data.endTime,
                completionRate: data.completionRate,
                note: data.note
            }
        });
    }

    async findPreviousAttempt(studentId: number, examSetId: number) {
        return this.prisma.examAttempt.findFirst({
            where: {
                studentId: +studentId,
                examSetId: +examSetId,
            }
        });
    }
}
