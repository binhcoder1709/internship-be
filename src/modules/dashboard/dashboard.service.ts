import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaProvider) {}

    // Lấy tổng số sinh viên trong hệ thống
    private async getTotalStudents(): Promise<number> {
        return this.prisma.student.count();
    }

    // Lấy số sinh viên đang/đã tham gia thực tập (mỗi sinh viên chỉ tính 1 lần)
    private async getActiveInterns(): Promise<number> {
        return (await this.prisma.internshipGroupStudent.groupBy({
            by: ['studentId']
        })).length;
    }

    // Lấy số sinh viên đã có kết quả thực tập (không còn WAITING)
    private async getCompletedInterns(): Promise<number> {
        return (await this.prisma.internshipGroupStudent.groupBy({
            by: ['studentId'],
            where: {
                internshipResult: {
                    not: 'WAITING'
                }
            }
        })).length;
    }

    // Lấy số sinh viên vi phạm (đã có kết quả và có vi phạm)
    private async getViolatedInterns(): Promise<number> {
        return (await this.prisma.internshipGroupStudent.groupBy({
            by: ['studentId'],
            where: {
                internshipResult: {
                    not: 'WAITING'
                },
                internshipRegulation: {
                    not: '[]'
                }
            }
        })).length;
    }

    // Tính toán tỷ lệ tham gia thực tập
    private calculateParticipationStats(activeInterns: number, completedInterns: number, violatedInterns: number) {
        // Số sinh viên đang tham gia = tổng - đã hoàn thành
        const participatingInterns = activeInterns - completedInterns;
        
        // Tính tỷ lệ trên tổng số sinh viên tham gia (activeInterns)
        const participating = Math.round((participatingInterns / activeInterns) * 100);
        const completed = Math.round(((completedInterns - violatedInterns) / activeInterns) * 100);
        const violated = Math.round((violatedInterns / activeInterns) * 100);

        return {
            participating: {
                count: participatingInterns,    // Số lượng đang thực tập
                percentage: participating       // Tỷ lệ đang thực tập
            },
            completed: {
                count: completedInterns - violatedInterns,  // Số lượng hoàn thành không vi phạm
                percentage: completed                       // Tỷ lệ hoàn thành không vi phạm
            },
            violated: {
                count: violatedInterns,         // Số lượng vi phạm
                percentage: violated            // Tỷ lệ vi phạm
            }
        };
    }

    // Tính tỷ lệ hoàn thành của những sinh viên đã có kết quả
    private calculateCompletionRate(completedInterns: number, violatedInterns: number) {
        // Tính số lượng thành công và thất bại
        const successCount = completedInterns - violatedInterns;
        const failedCount = violatedInterns;
        
        // Tính tỷ lệ trên tổng số sinh viên đã hoàn thành (completedInterns)
        const successPercentage = Math.round((successCount / completedInterns) * 100);
        const failedPercentage = Math.round((failedCount / completedInterns) * 100);

        return {
            success: {
                count: successCount,           // Số lượng hoàn thành tốt
                percentage: successPercentage  // Tỷ lệ hoàn thành tốt
            },
            failed: {
                count: failedCount,           // Số lượng hoàn thành có vi phạm
                percentage: failedPercentage  // Tỷ lệ hoàn thành có vi phạm
            }
        };
    }

    // Lấy tổng số task
    private async getTotalTasks(): Promise<number> {
        return this.prisma.internshipGroupTask.count();
    }

    // Lấy số task đã hoàn thành
    private async getCompletedTasks(): Promise<number> {
        return this.prisma.internshipGroupTask.count({
            where: {
                progress: {
                    not: 'WAITING'
                }
            }
        });
    }

    // Lấy số task chưa hoàn thành
    private async getUnfinishedTasks(): Promise<number> {
        return this.prisma.internshipGroupTask.count({
            where: {
                progress: 'UNFINISHED'
            }
        });
    }

    // Lấy số task chưa xử lý
    private async getWaitingTasks(): Promise<number> {
        return this.prisma.internshipGroupTask.count({
            where: {
                progress: 'WAITING'
            }
        });
    }

    // Lấy thống kê chi tiết các task theo mức độ hoàn thành
    private async getTaskCompletionStats(schoolId?: number) {
        const where = schoolId ? { student: { schoolId } } : {};
        const averageTasks = await this.prisma.internshipGroupTask.count({
            where: { ...where, progress: 'DONE_AVERAGE' }
        });

        const aboveAverageTasks = await this.prisma.internshipGroupTask.count({
            where: { ...where, progress: 'DONE_ABOVE_AVERAGE' }
        });

        const proficientTasks = await this.prisma.internshipGroupTask.count({
            where: { ...where, progress: 'DONE_PROFICIENT' }
        });

        const excellentTasks = await this.prisma.internshipGroupTask.count({
            where: { ...where, progress: 'DONE_EXCELLENT' }
        });

        const totalCompleted = averageTasks + aboveAverageTasks + proficientTasks + excellentTasks;

        return {
            average: {
                count: averageTasks,
                percentage: totalCompleted ? Math.round((averageTasks / totalCompleted) * 100) : 0
            },
            aboveAverage: {
                count: aboveAverageTasks,
                percentage: totalCompleted ? Math.round((aboveAverageTasks / totalCompleted) * 100) : 0
            },
            proficient: {
                count: proficientTasks,
                percentage: totalCompleted ? Math.round((proficientTasks / totalCompleted) * 100) : 0
            },
            excellent: {
                count: excellentTasks,
                percentage: totalCompleted ? Math.round((excellentTasks / totalCompleted) * 100) : 0
            }
        };
    }

    private async getViolationStats(schoolId?: number) {
        const where = schoolId ? { student: { schoolId } } : {};
        const violatedStudents = await this.prisma.internshipGroupStudent.findMany({
            where: {
                ...where,
                internshipRegulation: { not: '[]' }
            },
            select: { internshipRegulation: true }
        });

        let violateCount = 0;
        let hoursWorkedCount = 0;
        let taskLateCount = 0;
        let quizLateCount = 0;
        let essayLateCount = 0;

        violatedStudents.forEach(student => {
            const regulations: string[] = JSON.parse(student.internshipRegulation);
            if (regulations.includes('VIOLATE')) violateCount++;
            if (regulations.includes('HOURS_WORKED')) hoursWorkedCount++;
            if (regulations.includes('TASK_LATE')) taskLateCount++;
            if (regulations.includes('QUIZ_LATE')) quizLateCount++;
            if (regulations.includes('ESSAY_LATE')) essayLateCount++;
        });

        const totalViolatedStudents = violatedStudents.length;
        const calculatePercentage = (count: number) => 
            totalViolatedStudents ? Math.round((count / totalViolatedStudents) * 100) : 0;

        return {
            totalViolatedStudents,
            violate: {
                count: violateCount,
                percentage: calculatePercentage(violateCount)
            },
            hoursWorked: {
                count: hoursWorkedCount,
                percentage: calculatePercentage(hoursWorkedCount)
            },
            taskLate: {
                count: taskLateCount,
                percentage: calculatePercentage(taskLateCount)
            },
            quizLate: {
                count: quizLateCount,
                percentage: calculatePercentage(quizLateCount)
            },
            essayLate: {
                count: essayLateCount,
                percentage: calculatePercentage(essayLateCount)
            }
        };
    }

    private async getCompletionGradeStats(schoolId?: number) {
        const where = schoolId ? { student: { schoolId } } : {};
        const [totalGraded, averageCount, aboveAverageCount, proficientCount, excellentCount] = await Promise.all([
            this.prisma.internshipGroupStudent.count({
                where: {
                    ...where,
                    internshipResult: {
                        in: ['DONE_AVERAGE', 'DONE_ABOVE_AVERAGE', 'DONE_PROFICIENT', 'DONE_EXCELLENT']
                    }
                }
            }),
            this.prisma.internshipGroupStudent.count({
                where: {
                    ...where,
                    internshipResult: 'DONE_AVERAGE'
                }
            }),
            this.prisma.internshipGroupStudent.count({
                where: {
                    ...where,
                    internshipResult: 'DONE_ABOVE_AVERAGE'
                }
            }),
            this.prisma.internshipGroupStudent.count({
                where: {
                    ...where,
                    internshipResult: 'DONE_PROFICIENT'
                }
            }),
            this.prisma.internshipGroupStudent.count({
                where: {
                    ...where,
                    internshipResult: 'DONE_EXCELLENT'
                }
            })
        ]);

        const calculatePercentage = (count: number) => 
            totalGraded ? Math.round((count / totalGraded) * 100) : 0;

        return {
            totalGradedStudents: totalGraded,
            average: {
                count: averageCount,
                percentage: calculatePercentage(averageCount)
            },
            aboveAverage: {
                count: aboveAverageCount,
                percentage: calculatePercentage(aboveAverageCount)
            },
            proficient: {
                count: proficientCount,
                percentage: calculatePercentage(proficientCount)
            },
            excellent: {
                count: excellentCount,
                percentage: calculatePercentage(excellentCount)
            }
        };
    }

    // API endpoint để lấy thống kê
    async getStats() {
        // Lấy tất cả số liệu cần thiết
        const [
            totalStudents,
            activeInterns,
            completedInterns,
            violatedInterns,
            totalTasks,
            completedTasks,
            unfinishedTasks,
            waitingTasks,
            taskCompletionStats,
            violationStats,
            completionGrades
        ] = await Promise.all([
            this.getTotalStudents(),
            this.getActiveInterns(),
            this.getCompletedInterns(),
            this.getViolatedInterns(),
            this.getTotalTasks(),
            this.getCompletedTasks(),
            this.getUnfinishedTasks(),
            this.getWaitingTasks(),
            this.getTaskCompletionStats(),
            this.getViolationStats(),
            this.getCompletionGradeStats()
        ]);

        // Tính toán các tỷ lệ
        const participation = this.calculateParticipationStats(
            activeInterns,
            completedInterns,
            violatedInterns
        );

        const completionRate = this.calculateCompletionRate(
            completedInterns,
            violatedInterns
        );

        // Trả về kết quả
        return {
            totalStudents,        // Tổng số sinh viên trong hệ thống
            activeInterns,        // Tổng số sinh viên tham gia thực tập
            completedInterns,     // Số sinh viên đã có kết quả
            participation,        // Tỷ lệ tham gia theo trạng thái
            completionRate,        // Tỷ lệ hoàn thành của sinh viên đã có kết quả
            taskStats: {
                totalTasks,
                completedTasks,
                unfinishedTasks,
                waitingTasks,
                completionStats: taskCompletionStats
            },
            violationStats,
            completionGrades
        };
    }

    async getSchoolStats(schoolId: number) {
        const [
            totalStudents,
            activeInterns,
            completedInterns,
            violatedInterns,
            totalTasks,
            completedTasks,
            unfinishedTasks,
            waitingTasks,
            taskCompletionStats,
            violationStats,
            completionGrades
        ] = await Promise.all([
            // Tổng số sinh viên của trường
            this.prisma.student.count({
                where: { schoolId }
            }),
            // Số sinh viên tham gia thực tập
            (await this.prisma.internshipGroupStudent.groupBy({
                by: ['studentId'],
                where: {
                    student: { schoolId }
                }
            })).length,
            // Số sinh viên đã có kết quả (khác WAITING)
            (await this.prisma.internshipGroupStudent.groupBy({
                by: ['studentId'],
                where: {
                    internshipResult: { not: 'WAITING' },
                    student: { schoolId }
                }
            })).length,
            // Số sinh viên vi phạm
            (await this.prisma.internshipGroupStudent.groupBy({
                by: ['studentId'],
                where: {
                    internshipResult: { not: 'WAITING' },
                    internshipRegulation: { not: '[]' },
                    student: { schoolId }
                }
            })).length,
            // Tổng số task
            this.prisma.internshipGroupTask.count({
                where: {
                    student: { schoolId }
                }
            }),
            // Task đã hoàn thành
            this.prisma.internshipGroupTask.count({
                where: {
                    progress: { not: 'WAITING' },
                    student: { schoolId }
                }
            }),
            // Task chưa hoàn thành
            this.prisma.internshipGroupTask.count({
                where: {
                    progress: 'UNFINISHED',
                    student: { schoolId }
                }
            }),
            // Task chờ xử lý
            this.prisma.internshipGroupTask.count({
                where: {
                    progress: 'WAITING',
                    student: { schoolId }
                }
            }),
            // Thống kê task theo mức độ hoàn thành
            this.getTaskCompletionStats(schoolId),
            // Thống kê vi phạm
            this.getViolationStats(schoolId),
            // Thống kê xếp loại
            this.getCompletionGradeStats(schoolId)
        ]);

        const participation = this.calculateParticipationStats(
            activeInterns,
            completedInterns,
            violatedInterns
        );

        const completionRate = this.calculateCompletionRate(
            completedInterns,
            violatedInterns
        );

        return {
            totalStudents,
            activeInterns,
            completedInterns,
            participation,
            completionRate,
            taskStats: {
                totalTasks,
                completedTasks,
                unfinishedTasks,
                waitingTasks,
                completionStats: taskCompletionStats
            },
            violationStats,
            completionGrades
        };
    }
}
