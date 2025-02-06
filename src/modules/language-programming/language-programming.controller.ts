import { Controller, Get, Query, UseGuards, Headers, HttpException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LanguageProgrammingService } from './language-programming.service';
import { LanguageProgrammingFilterDto } from './dto/language-programming-filter.dto';
import { MasterAuthGuard } from 'src/guards/master-auth.guard';

@ApiTags('Language Programming Management')
@Controller('language-programming')
export class LanguageProgrammingController {
    constructor(private readonly languageProgrammingService: LanguageProgrammingService) {}

    @Get()
    @UseGuards(MasterAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy danh sách ngôn ngữ lập trình (MASTER ONLY)' })
    async findAll(
        @Query() filter: LanguageProgrammingFilterDto,
        @Headers('authorization') auth: string
    ) {
        try {
            const languages = await this.languageProgrammingService.findAll(filter);
            return {
                data: languages,
                message: ['SV_NOTICE_LANGUAGE_LIST'],
                description: 'Lấy danh sách ngôn ngữ lập trình thành công'
            };
        } catch (error) {
            throw new HttpException({
                message: ['SV_ERR_LANGUAGE_LIST_FAILED'],
                description: 'Có lỗi xảy ra khi lấy danh sách ngôn ngữ lập trình'
            }, 500);
        }
    }
}
