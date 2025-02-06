import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';

@Injectable()
export class SchoolAdminAuthService {
    constructor(private readonly prisma: PrismaProvider) {}

    async findByEmail(email: string) {
        return this.prisma.schoolAdmin.findFirst({
            where: { 
                email,
                deletedAt: null,
                status: 'ACTIVE'
            },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }

    async findById(id: number) {
        return this.prisma.schoolAdmin.findFirst({
            where: { 
                id: +id,
                deletedAt: null,
                status: 'ACTIVE'
            },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }
}
