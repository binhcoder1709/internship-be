import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { CreateExamSetDto } from './dto/create-exam-set.dto';
import { UpdateExamSetDto } from './dto/update-exam-set.dto';
import { ExamSetFilterDto } from './dto/exam-set-filter.dto';
import { StringUtil } from 'src/utils/string.util';

@Injectable()
export class ExamSetService {
    constructor(private readonly prisma: PrismaProvider) {}

    async create(data: CreateExamSetDto) {
        return this.prisma.examSet.create({ data });
    }

    async update(id: number, data: UpdateExamSetDto) {
        return this.prisma.examSet.update({
            where: { id: +id },
            data
        });
    }

    async delete(id: number) {
        const now = new Date();
        return this.prisma.examSet.update({
            where: { id: +id },
            data: { deletedAt: now }
        });
    }

    async findById(id: number) {
        return this.prisma.examSet.findFirst({
            where: { 
                id: +id,
                deletedAt: null
            },
            include: {
                questions: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                type: true,
                                questionText: true,
                                choiceList: true,
                                codingInitCode: true,
                                codingTestTemplate: true,
                                codingTestCases: true,
                                codingPerformanceCheck: true,
                                codingTimeLimit: true,
                                codingMemoryLimit: true,
                                fillAswer: true,
                                fillCaseSensitive: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        });
    }

    async findAll(filter: ExamSetFilterDto) {
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
                { title: { contains: normalizedSearch } },
                { description: { contains: normalizedSearch } }
            ];
        }

        const total = await this.prisma.examSet.count({ where });
        
        const examSets = await this.prisma.examSet.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                title: 'asc'
            },
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        });

        return {
            data: examSets,
            pagination: {
                page: +page,
                limit: +limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Kiểm tra câu hỏi tồn tại
     */
    async findQuestionsByIds(questionIds: number[]) {
        return this.prisma.question.findMany({
            where: {
                id: {
                    in: questionIds
                }
            },
            select: {
                id: true
            }
        });
    }

    /**
     * Thêm nhiều câu hỏi vào bộ đề và cập nhật questionCount
     */
    async addQuestions(examSetId: number, questionIds: number[]) {
        // Thực hiện trong transaction để đảm bảo tính nhất quán
        return this.prisma.$transaction(async (tx) => {
            // Thêm câu hỏi
            await tx.examSetQuestion.createMany({
                data: questionIds.map(questionId => ({
                    examSetId: examSetId,
                    questionId: questionId
                })),
                skipDuplicates: true
            });

            // Đếm lại số câu hỏi hiện tại
            const questionCount = await tx.examSetQuestion.count({
                where: { examSetId }
            });

            // Cập nhật questionCount
            return tx.examSet.update({
                where: { id: examSetId },
                data: { questionCount }
            });
        });
    }

    /**
     * Kiểm tra relation giữa exam set và question
     */
    async findExamSetQuestionRelation(examSetId: number, questionId: number) {
        return this.prisma.examSetQuestion.findUnique({
            where: {
                examSetId_questionId: {
                    examSetId: examSetId,
                    questionId: questionId
                }
            }
        });
    }

    /**
     * Xóa một câu hỏi khỏi bộ đề và cập nhật questionCount
     */
    async removeQuestion(examSetId: number, questionId: number) {
        // Thực hiện trong transaction để đảm bảo tính nhất quán
        return this.prisma.$transaction(async (tx) => {
            // Xóa câu hỏi
            await tx.examSetQuestion.delete({
                where: {
                    examSetId_questionId: {
                        examSetId: examSetId,
                        questionId: questionId
                    }
                }
            });

            // Đếm lại số câu hỏi hiện tại
            const questionCount = await tx.examSetQuestion.count({
                where: { examSetId }
            });

            // Cập nhật questionCount
            return tx.examSet.update({
                where: { id: examSetId },
                data: { questionCount }
            });
        });
    }

    async hasAttempts(examSetId: number): Promise<boolean> {
        const count = await this.prisma.examAttempt.count({
            where: {
                examSetId: +examSetId
            }
        });
        return count > 0;
    }
}
