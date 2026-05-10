import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, dto: CreateServiceDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.deletedAt) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this business');
    }

    return this.prisma.service.create({
      data: {
        ...dto,
        businessId,
      },
    });
  }

  async findAllByBusiness(businessId: string) {
    return this.prisma.service.findMany({
      where: { businessId, deletedAt: null },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service || service.deletedAt) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(id: string, userId: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service || service.deletedAt) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    if (service.business.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this service');
    }

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service || service.deletedAt) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    if (service.business.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this service');
    }

    return this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
