import { Injectable, HttpException } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { InternshipApplicationFilterDto } from './dto/internship-application-filter.dto';
import { InternshipApplicationProgress } from '@prisma/client';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { UpdateInterviewResultDto } from './dto/update-interview-result.dto';
import { GmailProvider } from 'src/providers/external/gmail.provider';
import { Templates } from 'src/providers/external/gmail.provider';

@Injectable()
export class InternshipApplicationService {
    constructor(private readonly prisma: PrismaProvider, private readonly gmail: GmailProvider) {}

    async findPosition(id: number) {
        return this.prisma.internshipPosition.findUnique({
            where: { 
                id: +id,
                deletedAt: null
            }
        });
    }

    async findExistingApplication(studentId: number, internshipPositionId: number) {
        return this.prisma.internshipApplication.findFirst({
            where: {
                studentId: +studentId,
                internshipPositionId: +internshipPositionId
            }
        });
    }

    async create(data: {
        studentId: number;
        internshipPositionId: number;
        address?: string;
        type?: 'FULL_TIME' | 'PART_TIME';
    }) {
        return this.prisma.internshipApplication.create({
            data: {
                studentId: +data.studentId,
                internshipPositionId: +data.internshipPositionId,
                address: data.address,
                type: data.type || 'FULL_TIME'
            }
        });
    }

    async findById(id: number) {
        return this.prisma.internshipApplication.findUnique({
            where: { id: +id },
            include: {
                student: true,
                internshipPosition: true,
                internshipGroup: {
                    include: {
                        internshipProject: true,
                        internshipGroupMonderator: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async findAll(filter: InternshipApplicationFilterDto) {
        const page = +(filter.page || 1);
        const limit = +(filter.limit || 10);
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filter.search) {
            where.OR = [
                { student: { fullName: { contains: filter.search } } },
                { student: { email: { contains: filter.search } } },
                { internshipPosition: { name: { contains: filter.search } } }
            ];
        }

        if (filter.progress) {
            where.progress = filter.progress;
        }

        if (filter.type) {
            where.type = filter.type;
        }

        const [total, items] = await Promise.all([
            this.prisma.internshipApplication.count({ where }),
            this.prisma.internshipApplication.findMany({
                where,
                include: {
                    student: true,
                    internshipPosition: {
                        include: {
                            internshipPositionRequirementList: {
                                include: {
                                    examSet: true
                                }
                            }
                        }
                    },
                    internshipGroup: {
                        include: {
                            internshipProject: true,
                            internshipGroupMonderator: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            email: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { createAt: 'desc' }
            })
        ]);

        // Lấy kết quả làm bài của sinh viên cho từng bộ đề
        const itemsWithExamResults = await Promise.all(
            items.map(async (application) => {
                // const examResults = await Promise.all(
                //     application.internshipPosition.internshipPositionRequirementList.map(async (requirement) => {
                //         const latestAttempt = await this.prisma.examAttempt.findFirst({
                //             where: {
                //                 studentId: application.studentId,
                //                 examSetId: requirement.examSetId
                //             },
                //             orderBy: {
                //                 startTime: 'desc'
                //             },
                //             select: {
                //                 id: true,
                //                 startTime: true,
                //                 endTime: true,
                //                 completionRate: true
                //             }
                //         });

                //         return {
                //             examSetId: requirement.examSetId,
                //             examSetTitle: requirement.examSet.title,
                //             minimumCompletionRate: requirement.minimumCompletionRate,
                //             latestAttempt: latestAttempt,
                //             isPassed: latestAttempt ? 
                //                 (latestAttempt.completionRate >= requirement.minimumCompletionRate) : 
                //                 false
                //         };
                //     })
                // );

                return {
                    ...application,
                    // examRequirements: examResults,
                    // overallStatus: examResults.every(result => result.isPassed) ? 
                    //     'PASSED_ALL_REQUIREMENTS' : 
                    //     'NOT_PASSED_ALL_REQUIREMENTS'
                };
            })
        );

        return {
            total,
            page,
            limit,
            totalPage: Math.ceil(total / limit),
            items: itemsWithExamResults
        };
    }

    private checkApplicationStatus(application: any) {
        if (application.rejectAt) {
            throw new HttpException({
                message: ['SV_ERR_APPLICATION_REJECTED'],
                description: 'Đơn đã bị từ chối'
            }, 400);
        }

        if (application.cancelAt) {
            throw new HttpException({
                message: ['SV_ERR_APPLICATION_CANCELLED'],
                description: 'Đơn đã bị hủy'
            }, 400);
        }
    }

    async updateProgress(id: number, progress: string) {
        const application = await this.findById(id);
        this.checkApplicationStatus(application);

        const timeField = `${progress.toLowerCase()}At`;
        return this.prisma.internshipApplication.update({
            where: { id: +id },
            data: {
                progress: progress as InternshipApplicationProgress,
                [timeField]: new Date()
            },
            include: {
                student: true,
                internshipPosition: true
            }
        });
    }

    async reject(id: number, rejectReason: string) {
        return this.prisma.internshipApplication.update({
            where: { id: +id },
            data: {
                rejectAt: new Date(),
                rejectReason
            },
            include: {
                student: true,
                internshipPosition: true
            }
        });
    }

    async updateInterview(id: number, data: UpdateInterviewDto & { progress: string }) {
        const application = await this.findById(id);
        this.checkApplicationStatus(application);

        const updated = await this.prisma.internshipApplication.update({
            where: { id: +id },
            data: {
                interviewLink: data.interviewLink,
                interviewTime: data.interviewTime,
                interviewNote: data.interviewNote,
                progress: data.progress as InternshipApplicationProgress
            },
            include: {
                student: true,
                internshipPosition: true
            }
        });

        // Gửi email thông báo
        await this.gmail.sendHtmlEmail(
            updated.student.email,
            Templates.interviewSchedule.subject,
            Templates.interviewSchedule.template(
                updated.student.fullName || 'Ứng viên',
                updated.internshipPosition.name,
                new Date(data.interviewTime).toLocaleString('vi-VN'),
                data.interviewLink,
                data.interviewNote
            )
        );

        return updated;
    }

    async cancel(id: number, cancelReason: string) {
        return this.prisma.internshipApplication.update({
            where: { id: +id },
            data: {
                cancelAt: new Date(),
                cancelReason
            },
            include: {
                student: true,
                internshipPosition: true
            }
        });
    }

    async findByStudentId(where: any, skip: number, take: number) {
        return this.prisma.internshipApplication.findMany({
            where,
            include: {
                internshipPosition: true
            },
            skip: +skip,
            take: +take,
            orderBy: { createAt: 'desc' }
        });
    }

    async countByStudentId(where: any) {
        return this.prisma.internshipApplication.count({ where });
    }

    async findGroup(id: number) {
        return this.prisma.internshipGroup.findUnique({
            where: { id: +id }
        });
    }

    async updateGroup(id: number, groupId: number) {
        const application = await this.findById(id);
        this.checkApplicationStatus(application);

        return this.prisma.internshipApplication.update({
            where: { id: +id },
            data: {
                internshipGroupId: +groupId,
                progress: 'GROUPED',
                groupedAt: new Date()
            },
            include: {
                student: true,
                internshipPosition: true,
                internshipGroup: {
                    include: {
                        internshipProject: true,
                        internshipGroupMonderator: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async updateGroupAndAddStudent(applicationId: number, groupId: number) {
        const application = await this.findById(applicationId);
        this.checkApplicationStatus(application);

        return this.prisma.$transaction(async (tx) => {
            // 1. Cập nhật application
            const updatedApplication = await tx.internshipApplication.update({
                where: { id: applicationId },
                data: {
                    internshipGroupId: groupId,
                    progress: 'GROUPED',
                    groupedAt: new Date()
                }
            });

            // 2. Thêm student vào group
            await tx.internshipGroupStudent.create({
                data: {
                    studentId: updatedApplication.studentId,
                    internshipGroupId: groupId
                }
            });

            return updatedApplication;
        });
    }

    async updateInterviewResult(id: number, data: UpdateInterviewResultDto & { progress: string }) {
        const application = await this.findById(id);
        this.checkApplicationStatus(application);

        return this.prisma.internshipApplication.update({
            where: { id: +id },
            data: {
                interviewResult: data.interviewResult,
                interviewResultNote: data.interviewResultNote,
                progress: data.progress as InternshipApplicationProgress,
                interviewedAt: new Date()
            },
            include: {
                student: true,
                internshipPosition: true
            }
        });
    }

    async getApplicationExamDetails(applicationId: number) {
        // 1. Lấy thông tin application và position requirements
        const application = await this.prisma.internshipApplication.findUnique({
            where: { id: +applicationId },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true
                    }
                },
                internshipPosition: {
                    include: {
                        internshipPositionRequirementList: {
                            include: {
                                examSet: true
                            }
                        }
                    }
                }
            }
        });

        if (!application) {
            throw new HttpException({
                message: ['SV_ERR_APPLICATION_NOT_FOUND'],
                description: 'Không tìm thấy đơn apply'
            }, 404);
        }

        // 2. Lấy chi tiết tất cả các lần làm bài của từng bộ đề
        const examDetailsPromises = application.internshipPosition.internshipPositionRequirementList.map(async (requirement) => {
            const attempts = await this.prisma.examAttempt.findMany({
                where: {
                    studentId: application.studentId,
                    examSetId: requirement.examSetId
                },
                include: {
                    submissions: {
                        include: {
                            question: {
                                select: {
                                    id: true,
                                    type: true,
                                    questionText: true,
                                    choiceList: true,
                                    choiceCorrectIndex: true,
                                    codingInitCode: true,
                                    codingTestTemplate: true,
                                    fillAswer: true,
                                    fillCaseSensitive: true,
                                    language: {
                                        select: {
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

            return {
                requirement: {
                    examSetId: requirement.examSetId,
                    examSetTitle: requirement.examSet.title,
                    examSetDescription: requirement.examSet.description,
                    minimumCompletionRate: requirement.minimumCompletionRate,
                    timeLimit: requirement.examSet.timeLimit,
                    questionCount: requirement.examSet.questionCount,
                    type: requirement.examSet.type
                },
                attempts: attempts.map(attempt => ({
                    id: attempt.id,
                    startTime: attempt.startTime,
                    endTime: attempt.endTime,
                    completionRate: attempt.completionRate,
                    isPassed: attempt.completionRate >= requirement.minimumCompletionRate,
                    submissions: attempt.submissions.map(submission => ({
                        id: submission.id,
                        questionType: submission.question.type,
                        question: submission.question.questionText,
                        studentAnswer: submission.answer,
                        isCorrect: submission.isCorrect,
                        submittedAt: submission.submittedAt,
                        details: this.getQuestionDetails(submission.question, submission.answer)
                    }))
                }))
            };
        });

        const examDetails = await Promise.all(examDetailsPromises);

        // 3. Tính toán thống kê tổng quan
        const statistics = {
            totalAttempts: examDetails.reduce((sum, exam) => sum + exam.attempts.length, 0),
            passedExams: examDetails.filter(exam => 
                exam.attempts.some(attempt => attempt.isPassed)
            ).length,
            totalExams: examDetails.length,
            isQualified: examDetails.every(exam => 
                exam.attempts.some(attempt => attempt.isPassed)
            ),
            averageScore: examDetails.reduce((sum, exam) => {
                const bestAttempt = exam.attempts.reduce((best, current) => 
                    (current.completionRate > (best?.completionRate || 0)) ? current : best
                , null);
                return sum + (bestAttempt?.completionRate || 0);
            }, 0) / examDetails.length
        };

        return {
            applicationId: application.id,
            student: application.student,
            position: {
                id: application.internshipPosition.id,
                name: application.internshipPosition.name
            },
            statistics,
            examDetails
        };
    }

    private getQuestionDetails(question: any, answer: string) {
        switch (question.type) {
            case 'MULTIPLE_CHOICE':
                return {
                    choices: question.choiceList?.split(','),
                    correctChoiceIndex: question.choiceCorrectIndex,
                    studentChoiceIndex: parseInt(answer)
                };
            case 'CODING':
                return {
                    language: question.language?.name,
                    initCode: question.codingInitCode,
                    testTemplate: question.codingTestTemplate,
                    studentCode: answer
                };
            case 'FILL_IN_THE_BLANK':
                return {
                    caseSensitive: question.fillCaseSensitive,
                    correctAnswers: question.fillAswer?.split(','),
                    studentAnswers: answer.split(',')
                };
            case 'ESSAY':
                return {
                    studentEssay: answer
                };
            default:
                return {};
        }
    }
}

