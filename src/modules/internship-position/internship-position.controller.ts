import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternshipPositionService } from './internship-position.service';
import { CreateInternshipPositionDto } from './dto/create-internship-position.dto';
import { UpdateInternshipPositionDto } from './dto/update-internship-position.dto';
import { InternshipPositionFilterDto } from './dto/internship-position-filter.dto';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';
import { AddPositionRequirementDto } from './dto/add-position-requirement.dto';

@ApiTags('Internship Position Management')
@Controller('internship-position')
export class InternshipPositionController {
    constructor(private readonly internshipPositionService: InternshipPositionService) {}

    @Post()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Tạo vị trí thực tập mới (MASTER ONLY)' })
    async create(
        @Body() data: CreateInternshipPositionDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const position = await this.internshipPositionService.create(data);
            return {
                data: position,
                message: ['SV_NOTICE_INTERNSHIP_POSITION_CREATED'],
                description: 'Tạo vị trí thực tập thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_POSITION_CREATE_FAILED'],
                description: 'Có lỗi xảy ra khi tạo vị trí thực tập'
            }, 500);
        }
    }

    @Put(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cập nhật vị trí thực tập (MASTER ONLY)' })
    async update(
        @Param('id') id: number,
        @Body() data: UpdateInternshipPositionDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const position = await this.internshipPositionService.findById(+id);
            if (!position) {
                throw new HttpException({
                    message: ['SV_ERR_INTERNSHIP_POSITION_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin vị trí thực tập'
                }, 404);
            }
            const updated = await this.internshipPositionService.update(+id, data);
            return {
                data: updated,
                message: ['SV_NOTICE_INTERNSHIP_POSITION_UPDATED'],
                description: 'Cập nhật vị trí thực tập thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_POSITION_UPDATE_FAILED'],
                description: 'Có lỗi xảy ra khi cập nhật vị trí thực tập'
            }, 500);
        }
    }

    @Delete(':id')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Xóa vị trí thực tập (MASTER ONLY)' })
    async delete(
        @Param('id') id: number,
        @Headers('authorization') auth: string
    ) {
        try {
            const position = await this.internshipPositionService.findById(+id);
            if (!position) {
                throw new HttpException({
                    message: ['SV_ERR_INTERNSHIP_POSITION_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin vị trí thực tập'
                }, 404);
            }
            await this.internshipPositionService.delete(+id);
            return {
                message: ['SV_NOTICE_INTERNSHIP_POSITION_DELETED'],
                description: 'Xóa vị trí thực tập thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_POSITION_DELETE_FAILED'],
                description: 'Có lỗi xảy ra khi xóa vị trí thực tập'
            }, 500);
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin vị trí thực tập' })
    async findOne(@Param('id') id: number) {
        try {
            const position = await this.internshipPositionService.findById(id);
            if (!position) {
                throw new HttpException({
                    message: ['SV_ERR_INTERNSHIP_POSITION_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin vị trí thực tập'
                }, 404);
            }
            return position;
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER'],
                description: 'Có lỗi xảy ra khi tìm kiếm vị trí thực tập'
            }, 500);
        }
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách vị trí thực tập' })
    async findAll(@Query() filter: InternshipPositionFilterDto) {
        try {
            return await this.internshipPositionService.findAll(filter);
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_INTERNAL_SERVER'],
                description: 'Có lỗi xảy ra khi lấy danh sách vị trí thực tập'
            }, 500);
        }
    }

    @Post(':id/requirement')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Thêm yêu cầu bộ đề cho vị trí thực tập (MASTER ONLY)' })
    async addRequirement(
        @Param('id') id: number,
        @Body() data: AddPositionRequirementDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const position = await this.internshipPositionService.findById(+id);
            if (!position) {
                throw new HttpException({
                    message: ['SV_ERR_INTERNSHIP_POSITION_NOT_FOUND'],
                    description: 'Không tìm thấy thông tin vị trí thực tập'
                }, 404);
            }

            const requirement = await this.internshipPositionService.addRequirement(+id, data);
            return {
                data: requirement,
                message: ['SV_NOTICE_INTERNSHIP_POSITION_REQUIREMENT_ADDED'],
                description: 'Thêm yêu cầu bộ đề thành công'
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new HttpException({
                    message: ['SV_ERR_INTERNSHIP_POSITION_REQUIREMENT_EXISTS'],
                    description: 'Yêu cầu bộ đề này đã tồn tại cho vị trí thực tập'
                }, 400);
            }
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_POSITION_REQUIREMENT_ADD_FAILED'],
                description: 'Có lỗi xảy ra khi thêm yêu cầu bộ đề'
            }, 500);
        }
    }

    @Delete(':id/requirement/:examSetId')
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Xóa yêu cầu bộ đề khỏi vị trí thực tập (MASTER ONLY)' })
    async removeRequirement(
        @Param('id') id: number,
        @Param('examSetId') examSetId: number,
        @Headers('authorization') auth: string
    ) {
        try {
            await this.internshipPositionService.removeRequirement(+id, +examSetId);
            return {
                message: ['SV_NOTICE_INTERNSHIP_POSITION_REQUIREMENT_REMOVED'],
                description: 'Xóa yêu cầu bộ đề thành công'
            };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new HttpException({
                    message: ['SV_ERR_INTERNSHIP_POSITION_REQUIREMENT_NOT_FOUND'],
                    description: 'Không tìm thấy yêu cầu bộ đề này'
                }, 404);
            }
            throw new HttpException({
                message: ['SV_ERR_INTERNSHIP_POSITION_REQUIREMENT_REMOVE_FAILED'],
                description: 'Có lỗi xảy ra khi xóa yêu cầu bộ đề'
            }, 500);
        }
    }
}
