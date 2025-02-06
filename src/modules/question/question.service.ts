import { Injectable } from '@nestjs/common';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto } from './dto';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { StringUtil } from 'src/utils/string.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionService {
    constructor(private prisma: PrismaProvider) {}

    async create(data: CreateQuestionDto) {
        return this.prisma.question.create({
            data: {
                type: data.type,
                questionText: data.questionText,
                languageId: data.languageId,

                // MULTIPLE_CHOICE
                choiceList: data.type === 'MULTIPLE_CHOICE' ? data.choiceList : null,
                choiceCorrectIndex: data.type === 'MULTIPLE_CHOICE' ? data.choiceCorrectIndex : null,

                // CODING
                codingInitCode: data.type === 'CODING' ? data.codingInitCode : null,
                codingTestTemplate: data.type === 'CODING' ? data.codingTestTemplate : null,
                codingTestCases: data.type === 'CODING' ? data.codingTestCases : null,
                codingPerformanceCheck: data.type === 'CODING' ? data.codingPerformanceCheck : false,
                codingTimeLimit: data.type === 'CODING' ? data.codingTimeLimit : null,
                codingMemoryLimit: data.type === 'CODING' ? data.codingMemoryLimit : null,

                // FILL_IN_THE_BLANK
                fillAswer: data.type === 'FILL_IN_THE_BLANK' ? data.fillAswer : null,
                fillCaseSensitive: data.type === 'FILL_IN_THE_BLANK' ? data.fillCaseSensitive : false,
            }
        });
    }

    async update(id: number, data: UpdateQuestionDto) {
        return this.prisma.question.update({
            where: { id },
            data: {
                type: data.type,
                questionText: data.questionText,
                languageId: data.languageId,

                // MULTIPLE_CHOICE
                choiceList: data.type === 'MULTIPLE_CHOICE' ? data.choiceList : null,
                choiceCorrectIndex: data.type === 'MULTIPLE_CHOICE' ? data.choiceCorrectIndex : null,

                // CODING
                codingInitCode: data.type === 'CODING' ? data.codingInitCode : null,
                codingTestTemplate: data.type === 'CODING' ? data.codingTestTemplate : null,
                codingTestCases: data.type === 'CODING' ? data.codingTestCases : null,
                codingPerformanceCheck: data.type === 'CODING' ? data.codingPerformanceCheck : false,
                codingTimeLimit: data.type === 'CODING' ? data.codingTimeLimit : null,
                codingMemoryLimit: data.type === 'CODING' ? data.codingMemoryLimit : null,

                // FILL_IN_THE_BLANK
                fillAswer: data.type === 'FILL_IN_THE_BLANK' ? data.fillAswer : null,
                fillCaseSensitive: data.type === 'FILL_IN_THE_BLANK' ? data.fillCaseSensitive : false,
            }
        });
    }

    async delete(id: number) {
        return this.prisma.question.delete({
            where: { id }
        });
    }

    async findAll(filter: QuestionFilterDto) {
        const { page = 1, limit = 10, search, type, excludeExamSetId } = filter;
        const skip = (page - 1) * limit;

        // Xây dựng điều kiện where
        const whereConditions: Prisma.QuestionWhereInput = {};
        
        // Thêm điều kiện tìm kiếm nếu có
        if (search) {
            whereConditions.questionText = {
                contains: StringUtil.normalizeSearchText(search)
            };
        }

        // Thêm điều kiện filter theo type nếu có
        if (type) {
            whereConditions.type = type;
        }

        // Thêm điều kiện loại trừ exam set nếu có
        if (excludeExamSetId) {
            whereConditions.examSets = {
                none: {
                    examSetId: excludeExamSetId
                }
            };
        }

        // Get total count
        const total = await this.prisma.question.count({
            where: whereConditions
        });

        // Get questions
        const questions = await this.prisma.question.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        return {
            items: questions,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
