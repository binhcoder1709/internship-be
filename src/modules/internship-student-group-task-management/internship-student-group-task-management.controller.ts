import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudentAuthGuard } from 'src/guards/student-auth.guard';
import { InternshipStudentGroupTaskManagementService } from './internship-student-group-task-management.service';
import { GetTasksDto } from './dto/get-tasks.dto';

@ApiTags('Internship Student Group Task Management')
@Controller('internship-student-group-task-management')
@UseGuards(StudentAuthGuard)
@ApiBearerAuth('access-token')
export class InternshipStudentGroupTaskManagementController {
    constructor(
        private readonly internshipStudentGroupTaskManagementService: InternshipStudentGroupTaskManagementService
    ) {}

    @Get('groups')
    @ApiOperation({
        summary: 'Lấy danh sách group của student',
        description: 'API lấy danh sách các group mà student đang tham gia'
    })
    async getStudentGroups(@Request() req) {
        const groups = await this.internshipStudentGroupTaskManagementService
            .findGroupsByStudentId(req.student.id);

        return {
            data: groups,
            message: ['SV_NOTICE_STUDENT_GROUPS_FETCHED'],
            description: 'Lấy danh sách group thành công'
        };
    }

    @Get('groups/:groupId/tasks')
    @ApiOperation({
        summary: 'Lấy danh sách task của student trong group',
        description: 'API lấy danh sách các task của student trong một group cụ thể'
    })
    async getStudentTasks(
        @Param('groupId') groupId: number,
        @Query() query: GetTasksDto,
        @Request() req
    ) {

        //console.log("req", query);
        const tasks = await this.internshipStudentGroupTaskManagementService
            .findTasksByGroupAndStudent(groupId, req.student.id, query);

        return {
            data: tasks,
            message: ['SV_NOTICE_STUDENT_TASKS_FETCHED'],
            description: 'Lấy danh sách task thành công'
        };
    }
}
