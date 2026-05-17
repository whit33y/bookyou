import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const mockPrismaService = {
    appointment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();

    // Default: $transaction executes the callback with the same mock
    mockPrismaService.$transaction.mockImplementation((cb) =>
      cb(mockPrismaService),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      startTime: '2030-01-01T10:00:00Z',
      serviceId: 'service-1',
      businessId: 'bus-1',
      providerId: 'provider-1',
    };
    const clientId = 'client-1';

    it('should create an appointment if all validations pass', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        id: 'service-1',
        businessId: 'bus-1',
        duration: 30,
      });
      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'bus-1',
        ownerId: 'provider-1',
        staff: [],
      });
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      mockPrismaService.appointment.create.mockResolvedValue({
        id: 'app-1',
        ...dto,
      });

      const result = await service.create(clientId, dto);
      expect(result).toBeDefined();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.appointment.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if provider is already booked', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        id: 'service-1',
        businessId: 'bus-1',
        duration: 30,
      });
      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'bus-1',
        ownerId: 'provider-1',
        staff: [],
      });
      mockPrismaService.appointment.findFirst.mockResolvedValue({
        id: 'existing-app',
      });

      await expect(service.create(clientId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);
      await expect(service.create(clientId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if provider does not work for business', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        id: 'service-1',
        businessId: 'bus-1',
        duration: 30,
      });
      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'bus-1',
        ownerId: 'other-owner',
        staff: [],
      });

      await expect(service.create(clientId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status to CANCELLED if user is the client', async () => {
      const appointment = {
        id: 'app-1',
        clientId: 'client-1',
        businessId: 'bus-1',
        status: AppointmentStatus.PENDING,
        business: { ownerId: 'owner-1', staff: [] },
      };
      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...appointment,
        status: AppointmentStatus.CANCELLED,
      });

      const result = await service.updateStatus('app-1', 'client-1', {
        status: AppointmentStatus.CANCELLED,
      });
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('should throw ForbiddenException if client tries to CONFIRM', async () => {
      const appointment = {
        id: 'app-1',
        clientId: 'client-1',
        businessId: 'bus-1',
        status: AppointmentStatus.PENDING,
        business: { ownerId: 'owner-1', staff: [] },
      };
      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);

      await expect(
        service.updateStatus('app-1', 'client-1', {
          status: AppointmentStatus.CONFIRMED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update status to CONFIRMED if user is the owner', async () => {
      const appointment = {
        id: 'app-1',
        clientId: 'client-1',
        businessId: 'bus-1',
        status: AppointmentStatus.PENDING,
        business: { ownerId: 'owner-1', staff: [] },
      };
      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...appointment,
        status: AppointmentStatus.CONFIRMED,
      });

      const result = await service.updateStatus('app-1', 'owner-1', {
        status: AppointmentStatus.CONFIRMED,
      });
      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      const appointment = {
        id: 'app-1',
        clientId: 'client-1',
        businessId: 'bus-1',
        status: AppointmentStatus.PENDING,
        business: { ownerId: 'owner-1', staff: [] },
      };
      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);

      await expect(
        service.updateStatus('app-1', 'other-user', {
          status: AppointmentStatus.CANCELLED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when updating a terminal status', async () => {
      const appointment = {
        id: 'app-1',
        clientId: 'client-1',
        businessId: 'bus-1',
        status: AppointmentStatus.CANCELLED,
        business: { ownerId: 'owner-1', staff: [] },
      };
      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);

      await expect(
        service.updateStatus('app-1', 'owner-1', {
          status: AppointmentStatus.CONFIRMED,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findMyAppointments', () => {
    const userId = 'user-1';

    it('should return appointments where user is client, provider, or business owner', async () => {
      const appointments = [
        { id: 'app-1', clientId: userId, providerId: 'other' },
        { id: 'app-2', clientId: 'other', providerId: userId },
        { id: 'app-3', clientId: 'other', providerId: 'other' },
      ];
      mockPrismaService.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.findMyAppointments(userId);

      expect(result).toEqual(appointments);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
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
    });

    it('should return empty array when user has no appointments', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      const result = await service.findMyAppointments(userId);

      expect(result).toEqual([]);
    });
  });
});
