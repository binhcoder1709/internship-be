import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { GetTasksDto } from './dto/get-tasks.dto';
import { StringUtil } from 'src/utils/string.util';
import { InternshipGroupsProjectService } from '../internship-groups-project/internship-groups-project.service';

@Injectable()
export class InternshipStudentGroupTaskManagementService {
    constructor(
        private readonly prisma: PrismaProvider,
        private readonly internshipGroupsProjectService: InternshipGroupsProjectService
    ) {}

    async findGroupsByStudentId(studentId: number) {
        return this.prisma.internshipGroupStudent.findMany({
            where: {
                studentId: +studentId
            },
            select: {
                internshipGroup: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        progress: true,
                        startAt: true,
                        finishAt: true,
                        owner: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true
                            }
                        },
                        internshipGroupMonderator: {
                            select: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true,
                                        role: true
                                    }
                                }
                            }
                        },
                        internshipGroupStudent: {
                            select: {
                                student: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true,
                                    }
                                },
                                internshipNote: true,
                                internshipResult: true,
                                internshipResultEvaluateBy: true,
                                internshipRegulation: true
                            }
                        },
                        internshipProject: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                duration: true,
                                memberCount: true,
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
        });
    }

    async findTasksByGroupAndStudent(
        groupId: number,
        studentId: number,
        {
            page = 1,
            limit = 10,
            search,
            progress,
            regulations
        }: GetTasksDto
    ) {
        // Gọi hàm cập nhật trạng thái từ service khác
        await this.internshipGroupsProjectService.updateTrainingTasksStatus(groupId, studentId);

        const skip = ((page || 1) - 1) * (limit || 10);
        
        // Xây dựng điều kiện tìm kiếm
        const where = {
            internshipGroupId: +groupId,
            studentId: +studentId,
            ...(search && {
                OR: [
                    { taskName: { contains: StringUtil.normalizeSearchText(search) } },
                    { taskDetailMorning: { contains: StringUtil.normalizeSearchText(search) } },
                    { taskDetailAfternoon: { contains: StringUtil.normalizeSearchText(search) } }
                ]
            }),
            ...(progress && { progress }),
            ...(regulations && {
                regulations: {
                    contains: regulations
                }
            })
        };

        // Query đếm tổng số
        const total = await this.prisma.internshipGroupTask.count({ where });

        // Query lấy data có phân trang
        const tasks = await this.prisma.internshipGroupTask.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                internshipGroup: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        startAt: true,
                        progress: true,
                        owner: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true
                            }
                        }
                    }
                },
                interviewTrainingTask: {
                    include: {
                        examSet: {
                            select: {
                                id: true,
                                title: true,
                                description: true,
                                timeLimit: true,
                                type: true
                            }
                        },
                        examAttempt: {
                            select: {
                                id: true,
                                startTime: true,
                                endTime: true,
                                completionRate: true,
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
                                                questionText: true,
                                                choiceList: true,
                                                codingInitCode: true,
                                                language: {
                                                    select: {
                                                        id: true,
                                                        name: true
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    orderBy: {
                                        submittedAt: 'desc'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                startDate: 'asc'
            },
            skip,
            take: limit || 10
        });

        return {
            tasks,
            pagination: {
                page: page || 1,
                limit: limit || 10,
                total,
                totalPages: Math.ceil(total / (limit || 10))
            }
        };
    }
}
