import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { CreateApplicationDto } from './dto/create-application.dto';
import { GetApplicationsDto } from './dto/get-applications.dto';
import { InterviewResult, UpdateInterviewResponseDto } from './dto/update-interview-response.dto';

@Injectable()
export class InternshipStudentApplicationService {
    constructor(private readonly prisma: PrismaProvider) {}

    async findPosition(positionId: number) {
        return this.prisma.internshipPosition.findUnique({
            where: { 
                id: +positionId,
                deletedAt: null
            },
            include: {
                internshipPositionRequirementList: {
                    include: {
                        examSet: true
                    }
                }
            }
        });
    }

    async findExistingApplication(studentId: number, positionId: number) {
        return this.prisma.internshipApplication.findFirst({
            where: {
                studentId: +studentId,
                internshipPositionId: +positionId
            }
        });
    }

    async findBestAttempt(studentId: number, examSetId: number) {
        return this.prisma.examAttempt.findFirst({
            where: {
                studentId: +studentId,
                examSetId: +examSetId
            },
            orderBy: {
                completionRate: 'desc'
            }
        });
    }

    async createApplication(studentId: number, dto: CreateApplicationDto) {
        return this.prisma.internshipApplication.create({
            data: {
                studentId: +studentId,
                internshipPositionId: +dto.internshipPositionId,
                type: dto.type,
                address: dto.address,
                progress: 'WAITING'
            },
            include: {
                internshipPosition: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            }
        });
    }

    async findApplications(
        studentId: number, 
        {
            page = 1,
            limit = 10,
            search,
            progress
        }: GetApplicationsDto
    ) {
        const skip = (page - 1) * limit;

        const where = {
            studentId: +studentId,
            ...(search && {
                OR: [
                    {
                        internshipPosition: {
                            name: { contains: search }
                        }
                    },
                    {
                        internshipPosition: {
                            description: { contains: search }
                        }
                    }
                ]
            }),
            ...(progress && { progress })
        };

        const total = await this.prisma.internshipApplication.count({ where });

        const applications = await this.prisma.internshipApplication.findMany({
            where,
            include: {
                internshipPosition: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        internshipPositionRequirementList: {
                            include: {
                                examSet: {
                                    select: {
                                        id: true,
                                        title: true,
                                        description: true,
                                        timeLimit: true
                                    }
                                }
                            }
                        }
                    }
                },
                internshipGroup: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        progress: true,
                        startAt: true,
                        finishAt: true,
                        owner: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true
                            }
                        },
                        internshipProject: {
                            select: {
                                id: true,
                                name: true,
                                description: true
                            }
                        },
                        internshipGroupMonderator: {
                            select: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createAt: 'desc'
            },
            skip,
            take: limit
        });

        return {
            applications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findApplicationById(id: number) {
        return this.prisma.internshipApplication.findUnique({
            where: { id: +id },
            include: {
                internshipGroup: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        progress: true,
                        startAt: true,
                        finishAt: true,
                        internshipProject: {
                            select: {
                                id: true,
                                name: true,
                                description: true
                            }
                        },
                        internshipGroupMonderator: {
                            select: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async cancelApplication(id: number, cancelReason: string) {
        return this.prisma.internshipApplication.update({
            where: { id: +id },
            data: {
                cancelAt: new Date(),
                cancelReason,
                progress: 'WAITING' // Giữ nguyên progress
            },
            include: {
                internshipPosition: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            }
        });
    }

    async updateInterviewResponse(id: number, dto: UpdateInterviewResponseDto) {
        return this.prisma.internshipApplication.update({
            where: { id: +id },
            data: {
                interviewStudentResponseAt: new Date(),
                interviewStudentResponseNote: dto.interviewStudentResponseNote,
                interviewStudentResponseResult: dto.interviewStudentResponseResult === InterviewResult.ACCEPTED ? true : false
            },
            include: {
                internshipPosition: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            }
        });
    }
}
