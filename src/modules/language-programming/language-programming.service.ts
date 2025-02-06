import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/providers/local/prisma.provider';
import { LanguageProgrammingFilterDto } from './dto/language-programming-filter.dto';
import { StringUtil } from 'src/utils/string.util';

@Injectable()
export class LanguageProgrammingService {
    constructor(private readonly prisma: PrismaProvider) {}

    async findAll(filter: LanguageProgrammingFilterDto) {
        const { search } = filter;

        return this.prisma.languageProgramming.findMany({
            where: {
                deletedAt: null,
                ...(search && {
                    name: {
                        contains: StringUtil.normalizeSearchText(search)
                    }
                })
            },
            orderBy: {
                name: 'asc'
            }
        });
    }
}
