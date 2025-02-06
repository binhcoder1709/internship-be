import { ApiProperty } from '@nestjs/swagger';

export class ParticipationDetailDto {
    @ApiProperty({
        description: 'Số lượng sinh viên',
        example: 67
    })
    count: number;

    @ApiProperty({
        description: 'Tỷ lệ phần trăm',
        example: 67
    })
    percentage: number;
}

export class ParticipationStatsDto {
    @ApiProperty({
        description: 'Sinh viên đang trong quá trình thực tập (chưa có kết quả)',
        type: ParticipationDetailDto
    })
    participating: ParticipationDetailDto;

    @ApiProperty({
        description: 'Sinh viên đã hoàn thành thực tập (không vi phạm)',
        type: ParticipationDetailDto
    })
    completed: ParticipationDetailDto;

    @ApiProperty({
        description: 'Sinh viên đã hoàn thành nhưng có vi phạm quy chế',
        type: ParticipationDetailDto
    })
    violated: ParticipationDetailDto;
}

export class CompletionRateDto {
    @ApiProperty({
        description: 'Sinh viên hoàn thành tốt (không vi phạm)',
        type: ParticipationDetailDto
    })
    success: ParticipationDetailDto;

    @ApiProperty({
        description: 'Sinh viên hoàn thành nhưng có vi phạm',
        type: ParticipationDetailDto
    })
    failed: ParticipationDetailDto;
}

export class ViolationDetailDto {
    @ApiProperty({
        description: 'Số lượng sinh viên vi phạm',
        example: 10
    })
    count: number;

    @ApiProperty({
        description: 'Tỷ lệ phần trăm trên tổng số vi phạm',
        example: 25
    })
    percentage: number;
}

export class ViolationStatsDto {
    @ApiProperty({
        description: 'Tổng số sinh viên đã hoàn thành có vi phạm',
        example: 40
    })
    totalViolatedStudents: number;

    @ApiProperty({
        description: 'Vi phạm quy chế khác',
        type: ViolationDetailDto
    })
    violate: ViolationDetailDto;

    @ApiProperty({
        description: 'Vi phạm về giờ làm việc',
        type: ViolationDetailDto
    })
    hoursWorked: ViolationDetailDto;

    @ApiProperty({
        description: 'Vi phạm về nộp task trễ',
        type: ViolationDetailDto
    })
    taskLate: ViolationDetailDto;

    @ApiProperty({
        description: 'Vi phạm về làm quiz trễ',
        type: ViolationDetailDto
    })
    quizLate: ViolationDetailDto;

    @ApiProperty({
        description: 'Vi phạm về nộp essay trễ',
        type: ViolationDetailDto
    })
    essayLate: ViolationDetailDto;
}

export class CompletionGradeDto {
    @ApiProperty({
        description: 'Số lượng sinh viên đạt loại này',
        example: 25
    })
    count: number;

    @ApiProperty({
        description: 'Tỷ lệ phần trăm trên tổng số sinh viên đã hoàn thành',
        example: 30
    })
    percentage: number;
}

export class CompletionGradeStatsDto {
    @ApiProperty({
        description: 'Tổng số sinh viên đã hoàn thành (có kết quả)',
        example: 80
    })
    totalGradedStudents: number;

    @ApiProperty({
        description: 'Sinh viên đạt loại trung bình',
        type: CompletionGradeDto
    })
    average: CompletionGradeDto;

    @ApiProperty({
        description: 'Sinh viên đạt loại khá',
        type: CompletionGradeDto
    })
    aboveAverage: CompletionGradeDto;

    @ApiProperty({
        description: 'Sinh viên đạt loại giỏi',
        type: CompletionGradeDto
    })
    proficient: CompletionGradeDto;

    @ApiProperty({
        description: 'Sinh viên đạt loại xuất sắc',
        type: CompletionGradeDto
    })
    excellent: CompletionGradeDto;
}

export class DashboardStatsDto {
    @ApiProperty({
        description: 'Tổng số sinh viên trong hệ thống',
        example: 5234
    })
    totalStudents: number;

    @ApiProperty({
        description: 'Tổng số sinh viên đã/đang tham gia thực tập',
        example: 78
    })
    activeInterns: number;

    @ApiProperty({
        description: 'Số sinh viên đã có kết quả thực tập (không còn WAITING)',
        example: 112
    })
    completedInterns: number;

    @ApiProperty({
        description: 'Thống kê tỷ lệ tham gia thực tập (tính trên tổng số sinh viên tham gia)',
        type: ParticipationStatsDto
    })
    participation: ParticipationStatsDto;

    @ApiProperty({
        description: 'Thống kê tỷ lệ hoàn thành (tính trên số sinh viên đã có kết quả)',
        type: CompletionRateDto
    })
    completionRate: CompletionRateDto;

    @ApiProperty({
        description: 'Thống kê chi tiết về vi phạm quy chế',
        type: ViolationStatsDto
    })
    violationStats: ViolationStatsDto;

    @ApiProperty({
        description: 'Thống kê xếp loại hoàn thành thực tập',
        type: CompletionGradeStatsDto
    })
    completionGrades: CompletionGradeStatsDto;
}

export class TaskCompletionStatsDto {
    @ApiProperty({
        description: 'Số task hoàn thành ở mức trung bình',
        example: { count: 15, percentage: 30 }
    })
    average: ParticipationDetailDto;

    @ApiProperty({
        description: 'Số task hoàn thành ở mức khá',
        example: { count: 20, percentage: 40 }
    })
    aboveAverage: ParticipationDetailDto;

    @ApiProperty({
        description: 'Số task hoàn thành ở mức giỏi',
        example: { count: 10, percentage: 20 }
    })
    proficient: ParticipationDetailDto;

    @ApiProperty({
        description: 'Số task hoàn thành ở mức xuất sắc',
        example: { count: 5, percentage: 10 }
    })
    excellent: ParticipationDetailDto;
}

export class TaskStatsDto {
    @ApiProperty({
        description: 'Tổng số task',
        example: 100
    })
    totalTasks: number;

    @ApiProperty({
        description: 'Số task đã hoàn thành (khác WAITING và UNFINISHED)',
        example: 50
    })
    completedTasks: number;

    @ApiProperty({
        description: 'Số task chưa hoàn thành (UNFINISHED)',
        example: 20
    })
    unfinishedTasks: number;

    @ApiProperty({
        description: 'Số task chưa xử lý (WAITING)',
        example: 30
    })
    waitingTasks: number;

    @ApiProperty({
        description: 'Thống kê chi tiết các task đã hoàn thành theo mức độ',
        type: TaskCompletionStatsDto
    })
    completionStats: TaskCompletionStatsDto;
} 