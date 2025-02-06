import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchoolPublicService } from './school-public.service';
import { SchoolPublicFilterDto } from './dto/school-public-filter.dto';

@ApiTags('School Public')
@Controller('school-public')
export class SchoolPublicController {
    constructor(private readonly schoolPublicService: SchoolPublicService) {}

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách trường học (Public API)' })
    @ApiResponse({
        status: 200,
        description: 'Lấy danh sách trường học thành công',
        schema: {
            example: {
                data: [
                    {
                        id: 1,
                        name: "Trường THPT ABC",
                        address: "123 Đường XYZ",
                        studentCount: 100
                    }
                ],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 50,
                    totalPages: 5
                }
            }
        }
    })
    async findAll(@Query() query: SchoolPublicFilterDto) {
        return this.schoolPublicService.findAll(query);
    }
}
