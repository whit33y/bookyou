import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: { select: { services: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map(({ _count, ...cat }) => ({
      ...cat,
      serviceCount: _count.services,
    }));
  }
}
