import { Injectable, HttpException } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { GetTasksDto } from './dto/get-tasks.dto';
import { StringUtil } from 'src/utils/string.util';
import { InterviewTrainingTaskType } from '@prisma/client';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTrainingTaskDto } from './dto/update-training-task.dto';
import { UpdateStudentResultDto } from './dto/update-student-result.dto';

@Injectable()
export class InternshipGroupsProjectService {
    constructor(private readonly prisma: PrismaProvider) {}

    async findGroupById(groupId: number) {
        return this.prisma.internshipGroup.findUnique({
            where: { id: +groupId }
        });
    }

    async findProjectById(projectId: number) {
        return this.prisma.internshipProject.findFirst({
            where: { 
                id: +projectId,
                deletedAt: null
            }
        });
    }

    async updateGroupProject(groupId: number, projectId: number) {
        return this.prisma.internshipGroup.update({
            where: { id: +groupId },
            data: { 
                internshipProjectId: +projectId 
            },
            include: {
                internshipProject: true
            }
        });
    }

    async findGroupWithProject(groupId: number) {
        return this.prisma.internshipGroup.findUnique({
            where: { id: +groupId },
            include: {
                internshipProject: true
            }
        });
    }

    async findGroupStudents(groupId: number) {
        return this.prisma.internshipGroupStudent.findMany({
            where: { 
                internshipGroupId: +groupId
            },
            select: {
                studentId: true,
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });
    }

    public async updateTrainingTasksStatus(groupId: number, studentId: number) {
        // Lấy tất cả training tasks chưa hoàn thành
        const trainingTasks = await this.prisma.interviewTrainingTask.findMany({
            where: {
                internshipGroupTask: {
                    internshipGroupId: +groupId,
                    studentId: +studentId
                },
                status: 'UNFINISHED'
            },
            include: {
                internshipGroupTask: {
                    select: {
                        startDate: true
                    }
                }
            }
        });

        for (const task of trainingTasks) {
            // Lấy ngày của task chính
            const taskDate = task.internshipGroupTask.startDate;
            if (!taskDate) continue;

            // Tạo các mốc thời gian deadline theo loại task
            const deadlines = {
                MORNING_QUIZZ: new Date(taskDate.setHours(12, 0, 0, 0)),
                AFTERNOON_CODING: new Date(taskDate.setHours(18, 0, 0, 0)),
                NIGHT_ESSAY: new Date(taskDate.setHours(22, 0, 0, 0))
            };

            const deadline = deadlines[task.type];

            // Tìm lần làm bài cuối cùng của exam set này
            const lastAttempt = await this.prisma.examAttempt.findFirst({
                where: {
                    studentId: +studentId,
                    examSetId: task.examSetId,
                    endTime: {
                        not: null
                    }
                },
                orderBy: {
                    endTime: 'desc'
                }
            });

            if (!lastAttempt) {
                // Nếu không có lần làm nào và đã quá deadline
                if (new Date() > deadline) {
                    await this.prisma.interviewTrainingTask.update({
                        where: { id: task.id },
                        data: { 
                            isLate: true
                        }
                    });
                }
                continue;
            }

            // Cập nhật trạng thái
            await this.prisma.interviewTrainingTask.update({
                where: { id: task.id },
                data: {
                    examAttemptId: lastAttempt.id,
                    status: 'FINISHED',
                    isLate: lastAttempt.endTime > deadline
                }
            });
        }
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
        // Cập nhật trạng thái các training tasks trước
        await this.updateTrainingTasksStatus(groupId, studentId);

        const skip = (page - 1) * limit;
        
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
                // Thêm phần include training tasks và kết quả
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
                                note: true,
                                orderQuestionList: true,
                                examSet: {
                                    select: {
                                        id: true,
                                        title: true,
                                        description: true,
                                        timeLimit: true,
                                        type: true,
                                        questions: {
                                            select: {
                                                questionId: true,
                                                question: {
                                                    select: {
                                                        questionText: true,
                                                        type: true,
                                                        choiceList: true,
                                                        choiceCorrectIndex: true,
                                                        codingInitCode: true,
                                                        codingTestTemplate: true,
                                                        fillAswer: true,
                                                        fillCaseSensitive: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        student: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                startDate: 'asc'
            },
            skip,
            take: limit
        });

        return {
            tasks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async createTrainingTask(data: {
        internshipGroupTaskId: number;
        type: InterviewTrainingTaskType;
        examSetId: number;
        studentId: number;
    }) {
        try {
            // 1. Kiểm tra xem đã tồn tại task cùng loại chưa
            const existingTask = await this.prisma.interviewTrainingTask.findFirst({
                where: {
                    studentId: +data.studentId,
                    internshipGroupTaskId: +data.internshipGroupTaskId,
                    type: data.type
                }
            });

            if (existingTask) {
                throw new HttpException({
                    message: ['SV_ERR_TRAINING_TASK_DUPLICATE'],
                    description: 'Student đã có task training cùng loại cho task này'
                }, 400);
            }

            // 2. Kiểm tra bộ đề có phải loại INTERVIEW_TRAINING không
            const examSet = await this.prisma.examSet.findUnique({
                where: { id: +data.examSetId }
            });

            if (!examSet || examSet.type !== 'INTERVIEW_TRAINING') {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_EXAM_SET_TYPE'],
                    description: 'Bộ đề không phải loại dành cho training'
                }, 400);
            }

            // 3. Kiểm tra student đã từng làm bộ đề này chưa
            const existingAttempt = await this.prisma.examAttempt.findFirst({
                where: {
                    studentId: +data.studentId,
                    examSetId: +data.examSetId,
                    endTime: {
                        not: null
                    }
                }
            });

            if (existingAttempt) {
                throw new HttpException({
                    message: ['SV_ERR_EXAM_ALREADY_ATTEMPTED'],
                    description: 'Student đã từng làm bộ đề này'
                }, 400);
            }

            // 4. Kiểm tra xem bộ đề này đã được sử dụng cho các buổi khác trong cùng task chưa
            const existingTaskWithSameExam = await this.prisma.interviewTrainingTask.findFirst({
                where: {
                    internshipGroupTaskId: +data.internshipGroupTaskId,
                    examSetId: +data.examSetId,
                    type: {
                        not: data.type
                    }
                }
            });

            if (existingTaskWithSameExam) {
                throw new HttpException({
                    message: ['SV_ERR_EXAM_SET_ALREADY_USED'],
                    description: 'Bộ đề này đã được sử dụng cho buổi khác trong cùng task'
                }, 400);
            }

            // 5. Tạo training task mới
            return await this.prisma.interviewTrainingTask.create({
                data: {
                    internshipGroupTaskId: +data.internshipGroupTaskId,
                    type: data.type,
                    examSetId: +data.examSetId,
                    studentId: +data.studentId,
                    status: 'UNFINISHED'
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    },
                    internshipGroupTask: {
                        select: {
                            id: true,
                            taskName: true,
                            startDate: true,
                            finishDate: true
                        }
                    },
                    examSet: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            timeLimit: true,
                            type: true
                        }
                    }
                }
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_CREATE_TRAINING_TASK_FAILED'],
                description: 'Không thể tạo training task'
            }, 500);
        }
    }

    async findGroupTaskById(taskId: number) {
        return this.prisma.internshipGroupTask.findUnique({
            where: { id: +taskId },
            include: {
                internshipGroup: true
            }
        });
    }

    async updateTask(taskId: number, data: UpdateTaskDto) {
        // Chuẩn bị data update
        const updateData: any = {
            ...data,
            // Chuyển regulations array thành JSON string nếu có
            ...(data.regulations && {
                regulations: JSON.stringify(data.regulations)
            })
        };

        return this.prisma.internshipGroupTask.update({
            where: { id: +taskId },
            data: updateData,
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
                        examSet: true,
                        examAttempt: {
                            include: {
                                submissions: true
                            }
                        }
                    }
                }
            }
        });
    }

    async findTrainingTaskById(id: number) {
        return this.prisma.interviewTrainingTask.findUnique({
            where: { id: +id },
            include: {
                internshipGroupTask: {
                    include: {
                        internshipGroup: true
                    }
                }
            }
        });
    }

    async updateTrainingTask(id: number, data: UpdateTrainingTaskDto) {
        try {
            return await this.prisma.interviewTrainingTask.update({
                where: { id: +id },
                data: {
                    status: data.status,
                    lectureComment: data.lectureComment,
                    type: data.type,
                    examSetId: data.examSetId,
                    examAttemptId: data.examAttemptId,
                    isLate: data.isLate
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    },
                    examSet: true,
                    examAttempt: {
                        include: {
                            submissions: true
                        }
                    },
                    internshipGroupTask: {
                        select: {
                            id: true,
                            taskName: true,
                            startDate: true,
                            finishDate: true
                        }
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async deleteTrainingTask(id: number) {
        return this.prisma.interviewTrainingTask.delete({
            where: { id: +id }
        });
    }

    async findTrainingTasksByGroupTaskId(internshipGroupTaskId: number) {
        return this.prisma.interviewTrainingTask.findMany({
            where: {
                internshipGroupTaskId: +internshipGroupTaskId
            },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true
                    }
                },
                internshipGroupTask: {
                    include: {
                        internshipGroup: {
                            include: {
                                owner: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                },
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
                        note: true,
                        orderQuestionList: true,
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
                                        choiceCorrectIndex: true,
                                        codingInitCode: true,
                                        codingTestTemplate: true,
                                        fillAswer: true,
                                        fillCaseSensitive: true
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
        });
    }

    async finishProject(groupId: number) {
        // Kiểm tra group có tồn tại và đang ở trạng thái START_PROJECT
        const group = await this.findGroupById(groupId);
        if (!group) {
            throw new HttpException({
                message: ['SV_ERR_GROUP_NOT_FOUND'],
                description: 'Không tìm thấy nhóm thực tập'
            }, 404);
        }
        
        if (group.progress !== 'START_PROJECT') {
            throw new HttpException({
                message: ['SV_ERR_INVALID_GROUP_STATUS'],
                description: 'Nhóm không ở trạng thái có thể kết thúc project'
            }, 400);
        }

        // Lấy danh sách sinh viên chưa có kết quả
        const unfinishedStudents = await this.prisma.internshipGroupStudent.findMany({
            where: {
                internshipGroupId: groupId,
                OR: [
                    { internshipResult: 'WAITING' }
                ]
            },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        if (unfinishedStudents.length > 0) {
            throw new HttpException({
                message: ['SV_ERR_UNFINISHED_STUDENTS'],
                description: 'Có sinh viên chưa được đánh giá kết quả',
                students: unfinishedStudents.map(s => ({
                    id: s.student.id,
                    fullName: s.student.fullName,
                    email: s.student.email,
                    result: s.internshipResult
                }))
            }, 400);
        }

        // Cập nhật trạng thái group
        return this.prisma.internshipGroup.update({
            where: { id: groupId },
            data: {
                progress: 'FINISH_PROJECT',
                finishAt: new Date()
            },
            include: {
                internshipGroupStudent: {
                    include: {
                        student: true
                    }
                }
            }
        });
    }

    async updateStudentResult(groupId: number, studentId: number, data: UpdateStudentResultDto, evaluateBy: string) {
        // Kiểm tra student có trong group không
        const groupStudent = await this.prisma.internshipGroupStudent.findUnique({
            where: {
                studentId_internshipGroupId: {
                    studentId: +studentId,
                    internshipGroupId: +groupId
                }
            },
            include: {
                student: true,
                internshipGroup: true
            }
        });

        if (!groupStudent) {
            throw new HttpException({
                message: ['SV_ERR_STUDENT_NOT_IN_GROUP'],
                description: 'Sinh viên không thuộc nhóm này'
            }, 404);
        }

        // Validate dữ liệu theo điều kiện
        if (data.internshipResult === 'UNFINISHED') {
            if (!data.internshipRegulation?.length) {
                throw new HttpException({
                    message: ['SV_ERR_REGULATION_REQUIRED'],
                    description: 'Cần chọn ít nhất một vi phạm khi kết quả là UNFINISHED'
                }, 400);
            }
        } else if (['DONE_AVERAGE', 'DONE_ABOVE_AVERAGE', 'DONE_PROFICIENT', 'DONE_EXCELLENT'].includes(data.internshipResult)) {
            if (!data.internshipNote) {
                throw new HttpException({
                    message: ['SV_ERR_NOTE_REQUIRED'],
                    description: 'Cần nhập ghi chú đánh giá khi kết quả là DONE'
                }, 400);
            }
        }

        // Cập nhật kết quả
        return this.prisma.internshipGroupStudent.update({
            where: {
                studentId_internshipGroupId: {
                    studentId: +studentId,
                    internshipGroupId: +groupId
                }
            },
            data: {
                internshipResult: data.internshipResult,
                internshipRegulation: data.internshipRegulation ? JSON.stringify(data.internshipRegulation) : '[]',
                internshipNote: data.internshipNote,
                internshipResultEvaluateBy: "Đánh giá bởi: " + evaluateBy.toUpperCase()
            },
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
                        progress: true
                    }
                }
            }
        });
    }
}
