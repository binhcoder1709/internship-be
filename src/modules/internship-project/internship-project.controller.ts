import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternshipProjectService } from './internship-project.service';
import { CreateInternshipProjectDto } from './dto/create-internship-project.dto';
import { UpdateInternshipProjectDto } from './dto/update-internship-project.dto';
import { InternshipProjectFilterDto } from './dto/internship-project-filter.dto';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';

@ApiTags('Internship Project Management')
@Controller('internship-project')
@UseGuards(MasterAuthGuard)
@ApiBearerAuth('access-token')
export class InternshipProjectController {
    constructor(private readonly internshipProjectService: InternshipProjectService) {}

    @Post()
    @ApiOperation({ summary: 'Tạo dự án thực tập mới (MASTER ONLY)' })
    async create(
        @Body() data: CreateInternshipProjectDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const project = await this.internshipProjectService.create(data);
            return {
                data: project,
                message: ['SV_NOTICE_INTERNSHIP_PROJECT_CREATED'],
                description: 'Tạo dự án thực tập thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_PROJECT_CREATE_FAILED'],
                description: 'Có lỗi xảy ra khi tạo dự án thực tập'
            }, 500);
        }
    }

    @Put(':id')
    @ApiOperation({ summary: 'Cập nhật dự án thực tập (MASTER ONLY)' })
    async update(
        @Param('id') id: number,
        @Body() data: UpdateInternshipProjectDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const project = await this.internshipProjectService.findById(id);
            if (!project) {
                throw new HttpException({
                    message: ['SV_ERR_INTERNSHIP_PROJECT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin dự án thực tập'
                }, 404);
            }

            const updated = await this.internshipProjectService.update(id, data);
            return {
                data: updated,
                message: ['SV_NOTICE_INTERNSHIP_PROJECT_UPDATED'],
                description: 'Cập nhật dự án thực tập thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_PROJECT_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật dự án thực tập'
            }, 500);
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa dự án thực tập (MASTER ONLY)' })
    async delete(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            const project = await this.internshipProjectService.findById(id);
            if (!project) {
                throw new HttpException({
                    message: ['SV_ERR_INTERNSHIP_PROJECT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin dự án thực tập'
                }, 404);
            }

            await this.internshipProjectService.delete(id);
            return {
                message: ['SV_NOTICE_INTERNSHIP_PROJECT_DELETED'],
                description: 'Xóa dự án thực tập thành công'
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_PROJECT_DELETE_FAILED'],
                description: 'Có lỗi xảy ra khi xóa dự án thực tập'
            }, 500);
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin dự án thực tập (MASTER ONLY)' })
    async findOne(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            const project = await this.internshipProjectService.findById(id);
            if (!project) {
                throw new HttpException({
                    message: ['SV_ERR_INTERNSHIP_PROJECT_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin dự án thực tập'
                }, 404);
            }
            return project;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_PROJECT_FETCH_FAILED'],
                description: 'Có lỗi xảy ra khi lấy thông tin dự án thực tập'
            }, 500);
        }
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách dự án thực tập (MASTER ONLY)' })
    async findAll(
        @Query() filter: InternshipProjectFilterDto,
        @Headers('authorization') auth: string
    ) {
        try {
            return await this.internshipProjectService.findAll(filter);
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_PROJECT_LIST_FAILED'],
                description: 'Có lỗi xảy ra khi lấy danh sách dự án thực tập'
            }, 500);
        }
    }
}
