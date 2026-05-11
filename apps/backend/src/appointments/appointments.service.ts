import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, dto: CreateAppointmentDto) {
    const { startTime, serviceId, businessId, providerId } = dto;

    const start = new Date(startTime);
    if (start < new Date()) {
      throw new ConflictException('Cannot book appointments in the past');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || service.businessId !== businessId || service.deletedAt) {
      throw new NotFoundException('Service not found or deleted');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { staff: true },
    });

    if (!business || business.deletedAt) {
      throw new NotFoundException('Business not found or deleted');
    }

    const isStaff = business.staff.some((s) => s.userId === providerId);
    if (!isStaff && business.ownerId !== providerId) {
      throw new ForbiddenException('Provider does not work for this business');
    }

    const end = new Date(start.getTime() + service.duration * 60000);

    // Check for double-booking
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        providerId,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          },
        ],
        deletedAt: null,
      },
    });

    if (overlapping) {
      throw new ConflictException('Provider is already booked at this time');
    }

    return this.prisma.appointment.create({
      data: {
        startTime: start,
        endTime: end,
        clientId,
        providerId,
        serviceId,
        businessId,
        status: AppointmentStatus.PENDING,
      },
      include: {
        service: true,
        business: true,
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    dto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!appointment || appointment.deletedAt) {
      throw new NotFoundException('Appointment not found');
    }

    const isClient = appointment.clientId === userId;
    const isBusinessOwner = appointment.business.ownerId === userId;
    const isProvider = appointment.providerId === userId;

    const staff = !isBusinessOwner
      ? await this.prisma.businessStaff.findUnique({
          where: {
            businessId_userId: {
              businessId: appointment.businessId,
              userId,
            },
          },
        })
      : null;
    const isStaff = !!staff;

    // Expert Role-Based Access Control (RBAC) for Status Transitions
    if (isClient && !isBusinessOwner && !isStaff) {
      if (dto.status !== AppointmentStatus.CANCELLED) {
        throw new ForbiddenException('Clients can only cancel appointments');
      }
    } else if (isBusinessOwner || isStaff || isProvider) {
      // Business side can do anything, but let's keep it sane
    } else {
      throw new ForbiddenException(
        'You do not have permission to update this appointment',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async findOne(id: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        provider: { select: { id: true, name: true, email: true } },
        service: true,
        business: true,
      },
    });

    if (!appointment || appointment.deletedAt) {
      throw new NotFoundException('Appointment not found');
    }

    // Security: Only involved parties can view
    const isClient = appointment.clientId === userId;
    const isProvider = appointment.providerId === userId;
    const isBusinessOwner = appointment.business.ownerId === userId;

    if (!isClient && !isProvider && !isBusinessOwner) {
      const staff = await this.prisma.businessStaff.findUnique({
        where: {
          businessId_userId: {
            businessId: appointment.businessId,
            userId,
          },
        },
      });
      if (!staff) {
        throw new ForbiddenException(
          'You do not have access to this appointment',
        );
      }
    }

    return appointment;
  }
}
