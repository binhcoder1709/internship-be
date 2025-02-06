import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternshipProjectPublicService } from './internship-project-public.service';
import { GetProjectsDto } from './dto/get-projects.dto';

@ApiTags('Internship Project Public')
@Controller('internship-project-public')
export class InternshipProjectPublicController {
    constructor(
        private readonly internshipProjectPublicService: InternshipProjectPublicService
    ) {}

    @Get()
    @ApiOperation({ 
        summary: 'Lấy danh sách dự án thực tập công khai',
        description: 'API công khai để lấy danh sách các dự án thực tập'
    })
    async getProjects(@Query() filter: GetProjectsDto) {
        const result = await this.internshipProjectPublicService.findAll(filter);
        return {
            data: result.data,
            pagination: result.pagination,
            message: ['SV_NOTICE_PROJECTS_FETCHED'],
            description: 'Lấy danh sách dự án thành công'
        };
    }
}
