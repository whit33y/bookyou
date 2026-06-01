import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { FindAllBusinessesQueryDto } from './dto/find-all-businesses-query.dto';
import { instanceToPlain } from 'class-transformer';

interface OpeningHoursDay {
  open: string;
  close: string;
}

interface OpeningHours {
  monday?: OpeningHoursDay;
  tuesday?: OpeningHoursDay;
  wednesday?: OpeningHoursDay;
  thursday?: OpeningHoursDay;
  friday?: OpeningHoursDay;
  saturday?: OpeningHoursDay;
  sunday?: OpeningHoursDay;
}

const SLOT_INTERVAL_MINUTES = 15;

const DAYS_OF_WEEK: (keyof OpeningHours)[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const BUSINESS_TIMEZONE = 'Europe/Warsaw';

function getLocalDateStr(d: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${y}-${m}-${day}`;
}

function getLocalMinutes(d: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const min = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return h * 60 + min;
}

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

  async findCities(): Promise<string[]> {
    const results = await this.prisma.business.findMany({
      where: { deletedAt: null },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return results.map((r) => r.city);
  }

  async findAll(query: FindAllBusinessesQueryDto) {
    const { search, city, category, limit = 20, offset = 0 } = query;

    const where: Prisma.BusinessWhereInput = { deletedAt: null };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }

    if (category) {
      where.services = {
        some: {
          category: { slug: { equals: category, mode: 'insensitive' } },
          deletedAt: null,
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.business.count({ where }),
    ]);

    return { data, total, limit, offset };
  }

  async findByOwner(ownerId: string) {
    return this.prisma.business.findFirst({
      where: { ownerId, deletedAt: null },
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

  async getAvailableSlots(
    businessId: string,
    date: string,
    serviceId: string,
  ): Promise<string[]> {
    const [business, service] = await Promise.all([
      this.prisma.business.findUnique({
        where: { id: businessId },
        select: { deletedAt: true, openingHours: true },
      }),
      this.prisma.service.findUnique({
        where: { id: serviceId },
        select: { businessId: true, duration: true, deletedAt: true },
      }),
    ]);

    if (!business || business.deletedAt) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    if (!service || service.deletedAt || service.businessId !== businessId) {
      throw new NotFoundException('Service not found for this business');
    }

    const openingHours = business.openingHours as OpeningHours | null;
    if (!openingHours) return [];

    const dayOfWeek = DAYS_OF_WEEK[new Date(date).getUTCDay()];
    const dayHours = openingHours[dayOfWeek];
    if (!dayHours) return [];

    const [openH, openM] = dayHours.open.split(':').map(Number);
    const [closeH, closeM] = dayHours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    // 12-hour buffer covers any UTC offset so we don't miss cross-midnight appointments
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    dayStart.setUTCHours(dayStart.getUTCHours() - 12);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    dayEnd.setUTCHours(dayEnd.getUTCHours() + 12);

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        businessId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        startTime: { lte: dayEnd },
        endTime: { gte: dayStart },
        deletedAt: null,
      },
      select: { startTime: true, endTime: true },
    });

    const bookedRanges = bookedAppointments
      .filter((a) => getLocalDateStr(a.startTime, BUSINESS_TIMEZONE) === date)
      .map((a) => ({
        start: getLocalMinutes(a.startTime, BUSINESS_TIMEZONE),
        end: getLocalMinutes(a.endTime, BUSINESS_TIMEZONE),
      }));

    const now = new Date();
    const todayStr = getLocalDateStr(now, BUSINESS_TIMEZONE);
    const isToday = todayStr === date;
    const nowMinutes = getLocalMinutes(now, BUSINESS_TIMEZONE);

    const slots: string[] = [];
    const { duration } = service;

    for (
      let m = openMinutes;
      m + duration <= closeMinutes;
      m += SLOT_INTERVAL_MINUTES
    ) {
      if (isToday && m <= nowMinutes) continue;

      const slotEnd = m + duration;
      const isBooked = bookedRanges.some((r) => m < r.end && slotEnd > r.start);

      if (!isBooked) {
        const h = Math.floor(m / 60).toString().padStart(2, '0');
        const min = (m % 60).toString().padStart(2, '0');
        slots.push(`${h}:${min}`);
      }
    }

    return slots;
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
