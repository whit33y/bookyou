import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateBusinessDto) {
    return this.prisma.business.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  async findAll() {
    return this.prisma.business.findMany({
      where: { deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          where: { deletedAt: null },
        },
      },
    });

    if (!business || business.deletedAt) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  async update(id: string, userId: string, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      select: { ownerId: true, deletedAt: true },
    });

    if (!business || business.deletedAt) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this business');
    }

    return this.prisma.business.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      select: { ownerId: true, deletedAt: true },
    });

    if (!business || business.deletedAt) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this business');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Soft-delete the business
      const updatedBusiness = await tx.business.update({
        where: { id },
        data: { deletedAt: now },
      });

      // Soft-delete all services belonging to this business
      await tx.service.updateMany({
        where: { businessId: id, deletedAt: null },
        data: { deletedAt: now },
      });

      return updatedBusiness;
    });
  }
}
