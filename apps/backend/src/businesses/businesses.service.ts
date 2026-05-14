import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateBusinessDto) {
    const { openingHours: openingHoursDto, ...rest } = dto;
    const openingHours = openingHoursDto
      ? instanceToPlain(openingHoursDto)
      : undefined;

    return this.prisma.business.create({
      data: {
        ...rest,
        openingHours: openingHours as any,
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

  async findByOwner(ownerId: string) {
    return this.prisma.business.findFirst({
      where: { ownerId, deletedAt: null },
      include: {
        services: {
          where: { deletedAt: null },
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

  async findServices(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, deletedAt: true },
    });

    if (!business || business.deletedAt) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    return this.prisma.service.findMany({
      where: { businessId, deletedAt: null },
    });
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

    const { openingHours: openingHoursDto, ...rest } = dto;
    const openingHours = openingHoursDto
      ? instanceToPlain(openingHoursDto)
      : undefined;

    return this.prisma.business.update({
      where: { id },
      data: {
        ...rest,
        ...(openingHours && { openingHours: openingHours as any }),
      },
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
