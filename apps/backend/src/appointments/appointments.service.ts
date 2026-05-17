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

    const end = new Date(start.getTime() + service.duration * 60_000);

    return this.prisma.$transaction(
      async (tx) => {
        const overlapping = await tx.appointment.findFirst({
          where: {
            OR: [{ providerId }, { clientId }],
            status: {
              in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
            },
            startTime: { lt: end },
            endTime: { gt: start },
            deletedAt: null,
          },
        });

        if (overlapping) {
          throw new ConflictException(
            overlapping.providerId === providerId
              ? 'Provider is already booked at this time'
              : 'You already have an appointment at this time',
          );
        }

        return tx.appointment.create({
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
              select: { id: true, name: true, email: true },
            },
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async updateStatus(
    id: string,
    userId: string,
    dto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { business: { include: { staff: true } } },
    });

    if (!appointment || appointment.deletedAt) {
      throw new NotFoundException('Appointment not found');
    }

    const isClient = appointment.clientId === userId;
    const isBusinessOwner = appointment.business.ownerId === userId;
    const isProvider = appointment.providerId === userId;
    const isStaff = appointment.business.staff.some((s) => s.userId === userId);
    const isPrivileged = isBusinessOwner || isStaff || isProvider;

    if (!isPrivileged && !isClient) {
      throw new ForbiddenException(
        'You do not have permission to update this appointment',
      );
    }

    if (!isPrivileged && dto.status !== AppointmentStatus.CANCELLED) {
      throw new ForbiddenException('Clients can only cancel appointments');
    }

    const terminalStatuses: AppointmentStatus[] = [
      AppointmentStatus.CANCELLED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.NOSHOW,
    ];

    if (terminalStatuses.includes(appointment.status)) {
      throw new ConflictException(
        `Cannot update appointment with status ${appointment.status}`,
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async findMyAppointments(userId: string) {
    return this.prisma.appointment.findMany({
      where: {
        OR: [
          { clientId: userId },
          { providerId: userId },
          { business: { ownerId: userId } },
        ],
        deletedAt: null,
      },
      orderBy: { startTime: 'desc' },
      include: {
        service: true,
        business: true,
        provider: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findBookedSlots(providerId: string, date: string): Promise<string[]> {
    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        providerId,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        startTime: { gte: dayStart, lte: dayEnd },
        deletedAt: null,
      },
      select: { startTime: true },
    });

    return appointments.map((a) => a.startTime.toISOString());
  }

  async findOne(id: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        provider: { select: { id: true, name: true, email: true } },
        service: true,
        business: { include: { staff: true } },
      },
    });

    if (!appointment || appointment.deletedAt) {
      throw new NotFoundException('Appointment not found');
    }

    const isClient = appointment.clientId === userId;
    const isProvider = appointment.providerId === userId;
    const isBusinessOwner = appointment.business.ownerId === userId;
    const isStaff = appointment.business.staff.some((s) => s.userId === userId);

    if (!isClient && !isProvider && !isBusinessOwner && !isStaff) {
      throw new ForbiddenException(
        'You do not have access to this appointment',
      );
    }

    return appointment;
  }
}
