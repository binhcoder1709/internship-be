import { Controller, Get, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { UserAuthGuard } from 'src/guards/user-auth.guard';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(UserAuthGuard)
@ApiBearerAuth('access-token')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('stats')
    @ApiOperation({
        summary: 'Lấy thống kê tổng quan hệ thống',
        description: 'API lấy các số liệu thống kê về sinh viên trong hệ thống'
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy thống kê thành công',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                totalStudents: {
                                    type: 'number',
                                    description: 'Tổng số sinh viên trong hệ thống',
                                    example: 17
                                },
                                activeInterns: {
                                    type: 'number',
                                    description: 'Tổng số sinh viên đã/đang tham gia thực tập',
                                    example: 10
                                },
                                completedInterns: {
                                    type: 'number',
                                    description: 'Số sinh viên đã có kết quả thực tập',
                                    example: 3
                                },
                                participation: {
                                    type: 'object',
                                    description: 'Thống kê tỷ lệ tham gia thực tập (tính trên tổng số sinh viên tham gia)',
                                    properties: {
                                        participating: {
                                            type: 'object',
                                            description: 'Sinh viên đang trong quá trình thực tập',
                                            properties: {
                                                count: { type: 'number', example: 7 },
                                                percentage: { type: 'number', example: 70 }
                                            }
                                        },
                                        completed: {
                                            type: 'object',
                                            description: 'Sinh viên đã hoàn thành không vi phạm',
                                            properties: {
                                                count: { type: 'number', example: 2 },
                                                percentage: { type: 'number', example: 20 }
                                            }
                                        },
                                        violated: {
                                            type: 'object',
                                            description: 'Sinh viên đã hoàn thành có vi phạm',
                                            properties: {
                                                count: { type: 'number', example: 1 },
                                                percentage: { type: 'number', example: 10 }
                                            }
                                        }
                                    }
                                },
                                completionRate: {
                                    type: 'object',
                                    description: 'Thống kê tỷ lệ hoàn thành (tính trên số sinh viên đã có kết quả)',
                                    properties: {
                                        success: {
                                            type: 'object',
                                            description: 'Sinh viên hoàn thành tốt',
                                            properties: {
                                                count: { type: 'number', example: 2 },
                                                percentage: { type: 'number', example: 67 }
                                            }
                                        },
                                        failed: {
                                            type: 'object',
                                            description: 'Sinh viên hoàn thành có vi phạm',
                                            properties: {
                                                count: { type: 'number', example: 1 },
                                                percentage: { type: 'number', example: 33 }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        message: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            example: ['SV_NOTICE_STATS_FETCHED']
                        },
                        description: {
                            type: 'string',
                            example: 'Lấy thống kê thành công'
                        }
                    }
                }
            }
        }
    })
    async getStats() {
        const stats = await this.dashboardService.getStats();
        return {
            data: stats,
            message: ['SV_NOTICE_STATS_FETCHED'],
            description: 'Lấy thống kê thành công'
        };
    }

    @Get('school/:schoolId/stats')
    @ApiOperation({
        summary: 'Lấy thống kê theo trường',
        description: 'API lấy các số liệu thống kê về sinh viên của một trường cụ thể'
    })
    @ApiParam({
        name: 'schoolId',
        description: 'ID của trường',
        type: Number
    })
    async getSchoolStats(@Param('schoolId', ParseIntPipe) schoolId: number) {
        const stats = await this.dashboardService.getSchoolStats(schoolId);
        return {
            data: stats,
            message: ['SV_NOTICE_SCHOOL_STATS_FETCHED'],
            description: 'Lấy thống kê theo trường thành công'
        };
    }
}
