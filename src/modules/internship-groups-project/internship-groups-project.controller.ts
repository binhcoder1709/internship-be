import { Body, Controller, Put, Param, UseGuards, Request, HttpException, Get, Query, Post, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { InternshipGroupsProjectService } from './internship-groups-project.service';
import { SetProjectDto } from './dto/set-project.dto';
import { UserAuthGuard } from 'src/guards/user-auth.guard';
import { InternshipGroupService } from '../internship-group/internship-group.service';
import { GoogleSheetsProvider } from 'src/providers/external/google-sheets.provider';
import { StartProjectDto } from './dto/start-project.dto';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { GetTasksDto } from './dto/get-tasks.dto';
import { CreateTrainingTaskDto } from './dto/create-training-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InternshipGroupTaskProgess, internshipRegulations } from '@prisma/client';
import { UpdateTrainingTaskDto } from './dto/update-training-task.dto';
import { UpdateStudentResultDto } from './dto/update-student-result.dto';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';

interface TaskItem {
    no: string;
    name: string;
    taskDetailMorning: string;
    taskDetailAfternoon: string;
    assign: string;
    dayIndex?: number;
}

// Helper function để kiểm tra ngày cuối tuần
function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

// Helper function để lấy ngày làm việc tiếp theo
function getNextWorkDay(date: Date): Date {
    const nextDay = new Date(date);
    do {
        nextDay.setDate(nextDay.getDate() + 1);
    } while (isWeekend(nextDay));
    return nextDay;
}

@ApiTags('Internship Groups Project Management')
@Controller('internship-groups-project')
@UseGuards(UserAuthGuard)
@ApiBearerAuth('access-token')
export class InternshipGroupsProjectController {
    constructor(
        private readonly internshipGroupsProjectService: InternshipGroupsProjectService,
        private readonly internshipGroupService: InternshipGroupService,
        private readonly googleSheetsProvider: GoogleSheetsProvider,
        private readonly prisma: PrismaProvider,
    ) {}

    @Put(':groupId/project')
    @ApiOperation({ 
        summary: 'Gán project cho nhóm (OWNER/MODERATOR ONLY)',
        description: `API gán project cho nhóm thực tập:
        - Chỉ owner hoặc moderator của nhóm mới có quyền
        - Chỉ có thể gán khi nhóm chưa ở trạng thái START_PROJECT
        - Project phải tồn tại và chưa bị xóa`
    })
    async setProject(
        @Param('groupId') groupId: number,
        @Body() data: SetProjectDto,
        @Request() req
    ) {
        try {
            // Kiểm tra quyền truy cập
            const hasAccess = await this.internshipGroupService.hasGroupAccess(+groupId, req.user.id);
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            // Kiểm tra group tồn tại và progress hợp lệ
            const group = await this.internshipGroupsProjectService.findGroupById(+groupId);
            if (!group) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_NOT_FOUND'],
                    description: 'Không tìm thấy nhóm thực tập'
                }, 404);
            }

            if (group.progress === 'START_PROJECT') {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_ALREADY_STARTED'],
                    description: 'Không thể thay đổi project khi nhóm đã bắt đầu'
                }, 400);
            }

            // Kiểm tra project tồn tại và chưa bị xóa
            const project = await this.internshipGroupsProjectService.findProjectById(+data.projectId);
            if (!project) {
                throw new HttpException({
                    message: ['SV_ERR_PROJECT_NOT_FOUND'],
                    description: 'Không tìm thấy project'
                }, 404);
            }

            // Cập nhật project cho group
            const updated = await this.internshipGroupsProjectService.updateGroupProject(+groupId, +data.projectId);

            return {
                data: updated,
                message: ['SV_NOTICE_GROUP_PROJECT_SET'],
                description: 'Gán project cho nhóm thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_SET_PROJECT_FAILED'],
                description: 'Không thể gán project cho nhóm'
            }, 500);
        }
    }

    @Put(':groupId/start-project')
    @ApiOperation({ 
        summary: 'Bắt đầu project cho nhóm (OWNER/MODERATOR ONLY)',
        description: 'API bắt đầu project cho nhóm thực tập'
    })
    async startProject(
        @Param('groupId') groupId: number,
        @Body() data: StartProjectDto,
        @Request() req
    ) {
        try {
            // 1. Kiểm tra quyền truy cập (owner/moderator)
            const hasAccess = await this.internshipGroupService.hasGroupAccess(+groupId, req.user.id);
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            // 2. Lấy thông tin group và project
            const group = await this.internshipGroupsProjectService.findGroupWithProject(+groupId);
            if (!group || !group.internshipProject?.projectPlanUrl) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_PROJECT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin project của nhóm'
                }, 404);
            }

            if (group.progress === 'START_PROJECT') {
                throw new HttpException({
                    message: ['SV_ERR_PROJECT_ALREADY_STARTED'],
                    description: 'Project đã được bắt đầu trước đó',
                    detail: {
                        groupId: group.id,
                        currentProgress: group.progress
                    }
                }, 400);
            }

            // 3. Kiểm tra các studentId có thuộc group không
            const groupStudents = await this.internshipGroupsProjectService.findGroupStudents(+groupId);
            const validStudentIds = groupStudents.map(s => s.student.id);
            const invalidStudents = [];

            for (const [position, studentId] of Object.entries(data.studentAssignments)) {
                if (!validStudentIds.includes(studentId)) {
                    invalidStudents.push({
                        position,
                        studentId,
                        message: 'Student không thuộc nhóm này'
                    });
                }
            }

            if (invalidStudents.length > 0) {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_STUDENT_ASSIGNMENTS'],
                    description: 'Một số student không thuộc nhóm này',
                    invalidStudents
                }, 400);
            }

            // Kiểm tra student không được assign cho nhiều vị trí
            const assignedStudents = Object.values(data.studentAssignments);
            const uniqueStudents = new Set(assignedStudents);
            
            if (assignedStudents.length !== uniqueStudents.size) {
                const duplicateStudents = assignedStudents.filter((studentId, index) => 
                    assignedStudents.indexOf(studentId) !== index
                );
                
                throw new HttpException({
                    message: ['SV_ERR_DUPLICATE_STUDENT_ASSIGNMENTS'],
                    description: 'Một student không thể được gán cho nhiều vị trí',
                    detail: {
                        duplicateStudents: duplicateStudents.map(studentId => ({
                            studentId,
                            positions: Object.entries(data.studentAssignments)
                                .filter(([_, id]) => id === studentId)
                                .map(([pos]) => pos)
                        }))
                    }
                }, 400);
            }

            // Sau phần check student hợp lệ, thêm các validation mới
            const { memberCount, duration } = group.internshipProject;
            
            // 1. Validate số lượng student
            const providedStudentCount = Object.keys(data.studentAssignments).length;
            if (providedStudentCount !== memberCount) {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_STUDENT_COUNT'],
                    description: 'Số lượng student không đúng yêu cầu',
                    detail: {
                        required: memberCount,
                        provided: providedStudentCount
                    }
                }, 400);
            }

            // 2. Validate số lượng task
            let taskData = await this.googleSheetsProvider.readSpreadsheet(group.internshipProject.projectPlanUrl, 'task-assign');
            //console.log("Raw taskData:", taskData);

            const taskLines = taskData.split('\n');
            //console.log("Task lines:", taskLines);

            // Bỏ qua header và lọc các dòng có data
            const tasks = taskLines
                .slice(1) // Bỏ qua header
                .filter(line => line && line.trim()) // Lọc bỏ dòng trống
                .map(line => {
                    const [no, name, morning, afternoon, assign] = line.split(',').map(item => item.replace(/"/g, '').trim());
                    return {
                        no,
                        name,
                        taskDetailMorning: morning,
                        taskDetailAfternoon: afternoon,
                        assign
                    };
                })
                .filter(task => task.no && task.assign); // Chỉ lấy các task có số thứ tự và được assign

            const requiredTaskCount = memberCount * duration;

            if (tasks.length < requiredTaskCount) {
                throw new HttpException({
                    message: ['SV_ERR_INSUFFICIENT_TASKS'],
                    description: 'Số lượng task không đủ cho project',
                    detail: {
                        requiredTasks: requiredTaskCount,
                        currentTasks: tasks.length,
                        calculation: `${memberCount} students × ${duration} days = ${requiredTaskCount} tasks required, but only ${tasks.length} tasks found`
                    }
                }, 400);
            }

            // Sau phần kiểm tra số lượng task
            // Nhóm task theo student và kiểm tra phân phối
            const tasksByStudent = tasks.reduce((acc, task) => {
                const studentKey = task.assign;
                if (!acc[studentKey]) {
                    acc[studentKey] = [];
                }
                acc[studentKey].push({
                    ...task,
                    dayIndex: acc[studentKey].length + 1
                });
                return acc;
            }, {} as Record<string, TaskItem[]>);

            //console.log("Tasks grouped by student:", tasksByStudent);

            // Kiểm tra số lượng task của mỗi student
            const expectedTasksPerStudent = tasks.length / Object.keys(data.studentAssignments).length;
            const invalidAssignments: Array<{
                student: string;
                expectedTasks: number;
                actualTasks: number;
                taskNumbers: string[];
            }> = [];

            for (const [student, studentTasks] of Object.entries(tasksByStudent) as [string, TaskItem[]][]) {
                if (studentTasks.length !== expectedTasksPerStudent) {
                    invalidAssignments.push({
                        student,
                        expectedTasks: expectedTasksPerStudent,
                        actualTasks: studentTasks.length,
                        taskNumbers: studentTasks.map(t => t.no)
                    });
                }
            }

            if (invalidAssignments.length > 0) {
                throw new HttpException({
                    message: ['SV_ERR_UNEVEN_TASK_DISTRIBUTION'],
                    description: 'Phân công task không đều giữa các thành viên',
                    detail: {
                        expectedTasksPerStudent,
                        invalidAssignments
                    }
                }, 400);
            }

            // Sắp xếp lại tasks theo student và thứ tự ngày
            const sortedTasks = Object.entries(tasksByStudent).flatMap(([student, tasks]: [string, TaskItem[]]) => 
                tasks.map((task, index) => ({
                    ...task,
                    dayNumber: index + 1,
                    student
                }))
            );

            //console.log("Sorted tasks:", sortedTasks);

            // Sau phần kiểm tra phân phối task
            const { startTime } = data;

            // Kiểm tra ngày bắt đầu có phải cuối tuần không
            if (isWeekend(new Date(startTime))) {
                throw new HttpException({
                    message: ['SV_ERR_INVALID_START_DATE'],
                    description: 'Ngày bắt đầu không được rơi vào thứ 7 hoặc chủ nhật',
                    detail: {
                        providedDate: startTime,
                        dayOfWeek: new Date(startTime).getDay()
                    }
                }, 400);
            }

            // Chuẩn bị dữ liệu để tạo tasks
            const taskCreationData = sortedTasks.map(task => {
                // Tính toán ngày bắt đầu dựa vào dayNumber
                let taskStartDate = new Date(startTime);
                
                // Nếu không phải ngày đầu tiên, tính toán ngày phù hợp
                if (task.dayNumber > 1) {
                    for (let i = 1; i < task.dayNumber; i++) {
                        taskStartDate = getNextWorkDay(taskStartDate);
                    }
                }
                
                // Ngày kết thúc cùng ngày với start
                const taskFinishDate = new Date(taskStartDate);

                return {
                    studentId: data.studentAssignments[task.student],
                    internshipGroupId: +groupId,
                    startDate: taskStartDate,
                    finishDate: taskFinishDate,
                    taskName: task.name,
                    taskDetailMorning: task.taskDetailMorning,
                    taskDetailAfternoon: task.taskDetailAfternoon
                };
            });

            try {
                // Sử dụng transaction để tạo tasks
                const createdTasks = await this.prisma.$transaction(async (prisma) => {
                    // 1. Tạo tất cả tasks
                    const tasks = await Promise.all(
                        taskCreationData.map(taskData => 
                            prisma.internshipGroupTask.create({
                                data: taskData
                            })
                        )
                    );

                    // 2. Update group progress
                    await prisma.internshipGroup.update({
                        where: { id: +groupId },
                        data: {
                            progress: 'START_PROJECT',
                            startAt: new Date(data.startTime)
                        }
                    });

                    return tasks;
                });

                return {
                    message: ['SV_NOTICE_PROJECT_STARTED'],
                    description: 'Bắt đầu project thành công',
                    data: {
                        tasksCreated: createdTasks.length,
                        startTime: data.startTime
                    }
                };

            } catch (error) {
                throw new HttpException({
                    message: ['SV_ERR_CREATE_TASKS_FAILED'],
                    description: 'Không thể tạo tasks cho project',
                    detail: error.message
                }, 500);
            }

        } catch (error) {
            //console.error('Error in startProject:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_START_PROJECT_FAILED'],
                description: 'Không thể bắt đầu project'
            }, 500);
        }
    }

    @Get(':groupId/student-requirements')
    @ApiOperation({ 
        summary: 'Lấy thông tin yêu cầu về student của project (OWNER/MODERATOR ONLY)',
        description: 'API lấy thông tin về số lượng và vị trí student cần được chỉ định trong project'
    })
    async getStudentRequirements(
        @Param('groupId') groupId: number,
        @Request() req
    ) {
        try {
            // 1. Kiểm tra quyền truy cập (owner/moderator)
            const hasAccess = await this.internshipGroupService.hasGroupAccess(+groupId, req.user.id);
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            // 2. Lấy thông tin group và project
            const group = await this.internshipGroupsProjectService.findGroupWithProject(+groupId);
            if (!group || !group.internshipProject?.projectPlanUrl) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_PROJECT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin project của nhóm'
                }, 404);
            }

            // 3. Đọc dữ liệu từ sheet
            const memberData = await this.googleSheetsProvider.readSpreadsheet(group.internshipProject.projectPlanUrl, 'member');
            
            // 4. Parse data để lấy danh sách student positions
            const lines = memberData.split('\n');
            const studentPositions = lines
                .slice(1) // Bỏ qua header
                .map(line => line.split(',')[1]) // Lấy cột STUDENT
                .filter(Boolean) // Lọc bỏ giá trị rỗng
                .map(position => position.replace(/"/g, '')); // Loại bỏ dấu quotes

            return {
                data: {
                    studentPositions,
                    requiredCount: studentPositions.length
                },
                message: ['SV_NOTICE_PROJECT_STUDENT_REQUIREMENTS_FETCHED'],
                description: 'Lấy thông tin yêu cầu về student thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GET_STUDENT_REQUIREMENTS_FAILED'],
                description: 'Không thể lấy thông tin yêu cầu về student'
            }, 500);
        }
    }

    @Get(':groupId/tasks/:studentId')
    @ApiOperation({
        summary: 'Lấy danh sách task của student trong group',
        description: `API lấy danh sách task của student trong group:
        - User có thể xem task của tất cả student
        - Hỗ trợ phân trang, tìm kiếm và filter
        - Tasks được sắp xếp theo thời gian bắt đầu`
    })
    async getStudentTasks(
        @Param('groupId') groupId: number,
        @Param('studentId') studentId: number,
        @Query() query: GetTasksDto,
        @Request() req
    ) {
        try {
            // Kiểm tra quyền truy cập
            if (req.user.role === undefined) { // Là student
                if (req.user.id !== +studentId) {
                    throw new HttpException({
                        message: ['SV_ERR_NOT_TASK_OWNER'],
                        description: 'Bạn không có quyền xem task của student khác'
                    }, 403);
                }
            }

            // Lấy danh sách tasks với phân trang và filter
            const result = await this.internshipGroupsProjectService
                .findTasksByGroupAndStudent(+groupId, +studentId, query);
            
            if (!result.tasks || result.tasks.length === 0) {
                return {
                    data: {
                        tasks: [],
                        pagination: result.pagination
                    },
                    message: ['SV_NOTICE_NO_TASKS_FOUND'],
                    description: 'Không tìm thấy task nào'
                };
            }

            return {
                data: result,
                message: ['SV_NOTICE_TASKS_FETCHED'],
                description: 'Lấy danh sách task thành công'
            };

        } catch (error) {
            console.error('Error in getStudentTasks:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GET_TASKS_FAILED'],
                description: 'Không thể lấy danh sách task'
            }, 500);
        }
    }

    @Post('training-task')
    @ApiOperation({
        summary: 'Tạo task training (OWNER/MODERATOR ONLY)',
        description: `API tạo task training cho student:
        - Chỉ owner hoặc moderator của group mới có quyền
        - Tạo task training (quiz sáng/coding chiều/essay tối) cho một task chính
        - Mỗi student chỉ có thể có 1 task training cùng loại cho 1 task chính
        - Liên kết với bộ đề thi tương ứng`
    })
    async createTrainingTask(
        @Body() data: CreateTrainingTaskDto,
        @Request() req
    ) {
        try {

            // 1. Kiểm tra task chính tồn tại
            const groupTask = await this.internshipGroupsProjectService
                .findGroupTaskById(data.internshipGroupTaskId);
            
            if (!groupTask) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_TASK_NOT_FOUND'],
                    description: 'Không tìm thấy task chính'
                }, 404);
            }

            // 2. Kiểm tra quyền truy cập
            const hasAccess = await this.internshipGroupService
                .hasGroupAccess(groupTask.internshipGroup.id, req.user.id);
            
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }


            // 3. Tạo training task
            const trainingTask = await this.internshipGroupsProjectService
                .createTrainingTask(data);


            return {
                data: trainingTask,
                message: ['SV_NOTICE_TRAINING_TASK_CREATED'],
                description: 'Tạo task training thành công'
            };

        } catch (error) {
            if (error.message === 'Student đã có task training cùng loại cho task này') {
                throw new HttpException({
                    message: ['SV_ERR_TRAINING_TASK_ALREADY_EXISTS'],
                    description: error.message
                }, 400);
            }
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_CREATE_TRAINING_TASK_FAILED'],
                description: 'Không thể tạo task training'
            }, 500);
        }
    }

    @Put('tasks/:taskId')
    @ApiOperation({
        summary: 'Cập nhật thông tin task (OWNER/MODERATOR ONLY)',
        description: `API cho phép cập nhật các thông tin của task như thời gian, trạng thái, nội dung,...

Progress (Trạng thái):
WAITING = Chờ xử lý
FINISHED = Hoàn thành
UNFINISHED = Không hoàn thành
DONE_AVERAGE = Trung bình
DONE_ABOVE_AVERAGE = Khá
DONE_PROFICIENT = Giỏi
DONE_EXCELLENT = Xuất sắc

Regulations (Quy định):
VIOLATE = Vi phạm
NOT_VIOLATE = Không vi phạm
HOURS_WORKED = Làm việc trễ
TASK_LATE = Làm task quá muộn
QUIZ_LATE = Làm bài thi quá muộn
ESSAY_LATE = Làm bài tập quá muộn`
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                startDate: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-03-20T08:00:00Z',
                    description: 'Thời gian bắt đầu task'
                },
                finishDate: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-03-20T17:00:00Z',
                    description: 'Thời gian kết thúc task'
                },
                progress: {
                    type: 'string',
                    enum: Object.values(InternshipGroupTaskProgess),
                    example: 'DONE_ABOVE_AVERAGE',
                    description: 'WAITING = Chờ xử lý\nFINISHED = Hoàn thành\nUNFINISHED = Không hoàn thành\nDONE_AVERAGE = Trung bình\nDONE_ABOVE_AVERAGE = Khá\nDONE_PROFICIENT = Giỏi\nDONE_EXCELLENT = Xuất sắc'
                },
                regulations: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: Object.values(internshipRegulations)
                    },
                    example: ['TASK_LATE', 'QUIZ_LATE'],
                    description: 'VIOLATE = Vi phạm\nNOT_VIOLATE = Không vi phạm\nHOURS_WORKED = Làm việc trễ\nTASK_LATE = Làm task quá muộn\nQUIZ_LATE = Làm bài thi quá muộn\nESSAY_LATE = Làm bài tập quá muộn'
                },
                mentorCommand: {
                    type: 'string',
                    example: 'Cần cải thiện phần UI, code sạch hơn',
                    description: 'Lệnh/nhận xét từ mentor'
                },
                taskName: {
                    type: 'string',
                    example: 'Implement login feature',
                    description: 'Tên task'
                },
                taskDetailMorning: {
                    type: 'string',
                    example: 'Thiết kế UI login form theo Figma',
                    description: 'Chi tiết công việc buổi sáng'
                },
                taskDetailAfternoon: {
                    type: 'string',
                    example: 'Implement API integration và validation',
                    description: 'Chi tiết công việc buổi chiều'
                }
            }
        }
    })
    async updateTask(
        @Param('taskId') taskId: number,
        @Body() data: UpdateTaskDto,
        @Request() req
    ) {
        try {
            // Kiểm tra task tồn tại
            const task = await this.internshipGroupsProjectService
                .findGroupTaskById(taskId);
            
            if (!task) {
                throw new HttpException({
                    message: ['SV_ERR_TASK_NOT_FOUND'],
                    description: 'Không tìm thấy task'
                }, 404);
            }

            // Kiểm tra quyền truy cập
            const hasAccess = await this.internshipGroupService
                .hasGroupAccess(task.internshipGroup.id, req.user.id);
            
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            // Cập nhật task
            const updatedTask = await this.internshipGroupsProjectService
                .updateTask(taskId, data);

            return {
                data: updatedTask,
                message: ['SV_NOTICE_TASK_UPDATED'],
                description: 'Cập nhật task thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_UPDATE_TASK_FAILED'],
                description: 'Không thể cập nhật task'
            }, 500);
        }
    }

    @Put('training-task/:id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Cập nhật training task (MASTER ONLY)',
        description: 'API cập nhật trạng thái và nhận xét của giảng viên cho training task'
    })
    @ApiResponse({
        status: 200,
        description: 'Cập nhật training task thành công',
        schema: {
            example: {
                data: {
                    id: 1,
                    status: 'FINISHED',
                    lectureComment: 'Bài làm tốt, cần cải thiện phần...',
                    student: {
                        id: 1,
                        fullName: 'Nguyen Van A',
                        email: 'a@example.com'
                    },
                    examSet: {
                        id: 1,
                        title: 'Bài test JavaScript cơ bản'
                    },
                    examAttempt: {
                        id: 1,
                        submissions: []
                    }
                },
                message: ['SV_NOTICE_TRAINING_TASK_UPDATED'],
                description: 'Cập nhật training task thành công'
            }
        }
    })
    async updateTrainingTask(
        @Param('id') id: number,
        @Body() dto: UpdateTrainingTaskDto
    ) {
        try {
            const task = await this.internshipGroupsProjectService.findTrainingTaskById(+id);
            if (!task) {
                throw new HttpException({
                    message: ['SV_ERR_TRAINING_TASK_NOT_FOUND'],
                    description: 'Không tìm thấy training task'
                }, 404);
            }

            const updated = await this.internshipGroupsProjectService.updateTrainingTask(+id, dto);

            return {
                data: updated,
                message: ['SV_NOTICE_TRAINING_TASK_UPDATED'],
                description: 'Cập nhật training task thành công'
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new HttpException({
                    message: ['SV_ERR_TRAINING_TASK_DUPLICATE'],
                    description: 'Student đã có task training cùng loại cho task này'
                }, 400);
            }
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_UPDATE_TRAINING_TASK_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật training task'
            }, 500);
        }
    }

    @Delete('training-task/:id')
    @ApiOperation({
        summary: 'Xóa training task (OWNER/MODERATOR ONLY)',
        description: 'API xóa training task, chỉ owner hoặc moderator của group mới có quyền'
    })
    async deleteTrainingTask(
        @Param('id') id: number,
        @Request() req
    ) {
        try {
            // Kiểm tra training task tồn tại
            const trainingTask = await this.internshipGroupsProjectService
                .findTrainingTaskById(id);
            
            if (!trainingTask) {
                throw new HttpException({
                    message: ['SV_ERR_TRAINING_TASK_NOT_FOUND'],
                    description: 'Không tìm thấy training task'
                }, 404);
            }

            // Kiểm tra quyền truy cập
            const hasAccess = await this.internshipGroupService
                .hasGroupAccess(trainingTask.internshipGroupTask.internshipGroup.id, req.user.id);
            
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            // Xóa training task
            await this.internshipGroupsProjectService.deleteTrainingTask(id);

            return {
                message: ['SV_NOTICE_TRAINING_TASK_DELETED'],
                description: 'Xóa training task thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_DELETE_TRAINING_TASK_FAILED'],
                description: 'Không thể xóa training task'
            }, 500);
        }
    }

    @Get('group-task/:internshipGroupTaskId/training-tasks')
    @ApiOperation({
        summary: 'Lấy danh sách training tasks của một group task (OWNER/MODERATOR ONLY)',
        description: 'API lấy toàn bộ training tasks của một group task cụ thể'
    })
    async getTrainingTasksByGroupTask(
        @Param('internshipGroupTaskId') internshipGroupTaskId: number,
        @Request() req
    ) {
        try {
            // Kiểm tra group task tồn tại
            const groupTask = await this.internshipGroupsProjectService
                .findGroupTaskById(internshipGroupTaskId);
            
            if (!groupTask) {
                throw new HttpException({
                    message: ['SV_ERR_GROUP_TASK_NOT_FOUND'],
                    description: 'Không tìm thấy task chính'
                }, 404);
            }

            // Kiểm tra quyền truy cập
            const hasAccess = await this.internshipGroupService
                .hasGroupAccess(groupTask.internshipGroup.id, req.user.id);
            
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            // Lấy danh sách training tasks
            const trainingTasks = await this.internshipGroupsProjectService
                .findTrainingTasksByGroupTaskId(internshipGroupTaskId);

            return {
                data: trainingTasks,
                message: ['SV_NOTICE_TRAINING_TASKS_FETCHED'],
                description: 'Lấy danh sách training tasks thành công'
            };

        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_GET_TRAINING_TASKS_FAILED'],
                description: 'Không thể lấy danh sách training tasks'
            }, 500);
        }
    }

    @Post(':groupId/finish')
    @ApiOperation({
        summary: 'Kết thúc project',
        description: 'API kết thúc project của group, kiểm tra kết quả của tất cả sinh viên'
    })
    @ApiParam({
        name: 'groupId',
        description: 'ID của group',
        type: Number
    })
    async finishProject(
        @Param('groupId', ParseIntPipe) groupId: number,
        @Request() req
    ) {
        try {
            const hasAccess = await this.internshipGroupService.hasGroupAccess(+groupId, req.user.id);
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            const result = await this.internshipGroupsProjectService.finishProject(groupId);
            return {
                data: result,
                message: ['SV_NOTICE_PROJECT_FINISHED'],
                description: 'Kết thúc project thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_FINISH_PROJECT_FAILED'],
                description: 'Không thể kết thúc project'
            }, 500);
        }
    }

    @Put(':groupId/student/:studentId/result')
    @ApiOperation({
        summary: 'Cập nhật kết quả thực tập cho sinh viên (OWNER/MODERATOR ONLY)',
        description: `API cập nhật kết quả thực tập cho sinh viên:
        - Chỉ owner hoặc moderator của group mới có quyền
        - Nếu kết quả là UNFINISHED thì bắt buộc phải có internshipRegulation
        - Nếu kết quả là DONE_* thì bắt buộc phải có internshipNote`
    })
    @ApiParam({ name: 'groupId', description: 'ID của group' })
    @ApiParam({ name: 'studentId', description: 'ID của sinh viên' })
    async updateStudentResult(
        @Param('groupId', ParseIntPipe) groupId: number,
        @Param('studentId', ParseIntPipe) studentId: number,
        @Body() data: UpdateStudentResultDto,
        @Request() req
    ) {
        try {
            const hasAccess = await this.internshipGroupService.hasGroupAccess(+groupId, req.user.id);
            if (!hasAccess) {
                throw new HttpException({
                    message: ['SV_ERR_NOT_GROUP_PERMISSION'],
                    description: 'Bạn không có quyền thực hiện hành động này'
                }, 403);
            }

            const result = await this.internshipGroupsProjectService.updateStudentResult(groupId, studentId, data, req.user.fullName || req.user.email);
            return {
                data: result,
                message: ['SV_NOTICE_STUDENT_RESULT_UPDATED'],
                description: 'Cập nhật kết quả thực tập thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_UPDATE_STUDENT_RESULT_FAILED'],
                description: error.message || 'Không thể cập nhật kết quả thực tập'
            }, 500);
        }
    }
}
