import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesService } from './businesses.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BusinessesService', () => {
  let service: BusinessesService;

  const mockPrismaService = {
    business: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a business', async () => {
      const dto = {
        name: 'Test Business',
        street: 'Street',
        city: 'City',
        zipCode: '12345',
      };
      const ownerId = 'user-1';
      mockPrismaService.business.create.mockResolvedValue({
        id: 'bus-1',
        ...dto,
        ownerId,
      });

      const result = await service.create(ownerId, dto);

      expect(result).toHaveProperty('id');
      expect(result.ownerId).toBe(ownerId);
    });
  });

  describe('findAll', () => {
    const businesses = [
      { id: 'bus-1', name: 'Salon A', city: 'Warsaw' },
      { id: 'bus-2', name: 'Salon B', city: 'Krakow' },
    ];

    it('should return paginated results with no filters', async () => {
      mockPrismaService.business.findMany.mockResolvedValue(businesses);
      mockPrismaService.business.count.mockResolvedValue(2);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: businesses,
        total: 2,
        limit: 20,
        offset: 0,
      });
      expect(mockPrismaService.business.findMany).toHaveBeenCalled();
      expect(mockPrismaService.business.count).toHaveBeenCalled();
    });

    it('should apply search filter on name', async () => {
      mockPrismaService.business.findMany.mockResolvedValue([businesses[0]]);
      mockPrismaService.business.count.mockResolvedValue(1);

      const result = await service.findAll({ search: 'Salon A' });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply city filter', async () => {
      mockPrismaService.business.findMany.mockResolvedValue([businesses[1]]);
      mockPrismaService.business.count.mockResolvedValue(1);

      const result = await service.findAll({ city: 'Krakow' });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply category filter via services relation', async () => {
      mockPrismaService.business.findMany.mockResolvedValue([businesses[0]]);
      mockPrismaService.business.count.mockResolvedValue(1);

      const result = await service.findAll({ category: 'Haircut' });

      expect(result.data).toHaveLength(1);
    });

    it('should respect limit and offset', async () => {
      mockPrismaService.business.findMany.mockResolvedValue([businesses[0]]);
      mockPrismaService.business.count.mockResolvedValue(2);

      const result = await service.findAll({ limit: 1, offset: 0 });

      expect(result.limit).toBe(1);
      expect(result.offset).toBe(0);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a business if found', async () => {
      const business = { id: 'bus-1', name: 'Test', deletedAt: null };
      mockPrismaService.business.findUnique.mockResolvedValue(business);

      const result = await service.findOne('bus-1');
      expect(result).toEqual(business);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bus-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findServices', () => {
    it('should return services for a business', async () => {
      const business = { id: 'bus-1', deletedAt: null };
      const services = [{ id: 'ser-1', name: 'Service 1' }];
      mockPrismaService.business.findUnique.mockResolvedValue(business);
      mockPrismaService.service.findMany.mockResolvedValue(services);

      const result = await service.findServices('bus-1');
      expect(result).toEqual(services);
      expect(mockPrismaService.service.findMany).toHaveBeenCalledWith({
        where: { businessId: 'bus-1', deletedAt: null },
      });
    });

    it('should throw NotFoundException if business not found', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);
      await expect(service.findServices('bus-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByOwner', () => {
    it('should return business with services for the owner', async () => {
      const business = {
        id: 'bus-1',
        name: 'Test Business',
        ownerId: 'user-1',
        deletedAt: null,
        services: [{ id: 'ser-1', name: 'Haircut', deletedAt: null }],
      };
      mockPrismaService.business.findFirst.mockResolvedValue(business);

      const result = await service.findByOwner('user-1');

      expect(result).toEqual(business);
      expect(mockPrismaService.business.findFirst).toHaveBeenCalledWith({
        where: { ownerId: 'user-1', deletedAt: null },
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
    });

    it('should return null if owner has no business', async () => {
      mockPrismaService.business.findFirst.mockResolvedValue(null);

      const result = await service.findByOwner('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getAvailableSlots', () => {
    const businessId = 'bus-1';
    const serviceId = 'ser-1';
    const futureMonday = '2099-06-15'; // Verified Monday (getUTCDay() === 1)
    const futureSunday = '2099-06-14'; // Verified Sunday  (getUTCDay() === 0)

    const mockBusiness = {
      deletedAt: null,
      openingHours: {
        monday: { open: '09:00', close: '17:00' },
      },
    };

    const mockService = {
      businessId,
      duration: 60,
      deletedAt: null,
    };

    beforeEach(() => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
    });

    it('should throw NotFoundException if business not found', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      await expect(
        service.getAvailableSlots(businessId, futureMonday, serviceId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.getAvailableSlots(businessId, futureMonday, serviceId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if service belongs to different business', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrismaService.service.findUnique.mockResolvedValue({
        ...mockService,
        businessId: 'other-bus',
      });

      await expect(
        service.getAvailableSlots(businessId, futureMonday, serviceId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return empty array if business has no opening hours', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue({
        deletedAt: null,
        openingHours: null,
      });
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.getAvailableSlots(
        businessId,
        futureMonday,
        serviceId,
      );
      expect(result).toEqual([]);
    });

    it('should return empty array if business is closed on that day', async () => {
      // futureSunday is Sunday; business only has monday hours
      mockPrismaService.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.getAvailableSlots(
        businessId,
        futureSunday,
        serviceId,
      );
      expect(result).toEqual([]);
    });

    it('should return all slots when nothing is booked', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.getAvailableSlots(
        businessId,
        futureMonday,
        serviceId,
      );

      // 09:00–17:00, 60 min service, 15 min intervals → 09:00, 09:15, ..., 16:00
      expect(result).toContain('09:00');
      expect(result).toContain('16:00');
      expect(result).not.toContain('16:15'); // 16:15 + 60min > 17:00
      expect(result.length).toBeGreaterThan(0);
    });

    it('should exclude slots that overlap with booked appointments', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      // Appointment at 10:00 local (Europe/Warsaw UTC+2 in summer) = 08:00 UTC
      const bookedStart = new Date(`${futureMonday}T08:00:00.000Z`);
      const bookedEnd = new Date(`${futureMonday}T09:00:00.000Z`);
      mockPrismaService.appointment.findMany.mockResolvedValue([
        { startTime: bookedStart, endTime: bookedEnd },
      ]);

      const result = await service.getAvailableSlots(
        businessId,
        futureMonday,
        serviceId,
      );

      // 10:00 local overlaps with booked 10:00–11:00 local
      expect(result).not.toContain('10:00');
      // 09:45 ends at 10:45 → overlaps with booked 10:00–11:00 local
      expect(result).not.toContain('09:45');
      // 09:00 ends exactly at 10:00 → touches start but does not overlap
      expect(result).toContain('09:00');
    });

    it('should correctly block slots for cross-midnight appointments', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue({
        deletedAt: null,
        openingHours: { monday: { open: '22:00', close: '24:00' } },
      });
      mockPrismaService.service.findUnique.mockResolvedValue({
        ...mockService,
        duration: 60,
      });

      // Appointment 23:30–00:30 local Warsaw (CEST = UTC+2)
      // 23:30 Warsaw = 21:30 UTC,  00:30 next day Warsaw = 22:30 UTC (same UTC day)
      const bookedStart = new Date(`${futureMonday}T21:30:00.000Z`);
      const bookedEnd = new Date(`${futureMonday}T22:30:00.000Z`);
      mockPrismaService.appointment.findMany.mockResolvedValue([
        { startTime: bookedStart, endTime: bookedEnd },
      ]);

      const result = await service.getAvailableSlots(
        businessId,
        futureMonday,
        serviceId,
      );

      // 23:00 slot ends at 00:00 — overlaps with 23:30–00:30 booking
      expect(result).not.toContain('23:00');
      // 22:00 slot ends at 23:00 — no overlap with 23:30–00:30
      expect(result).toContain('22:00');
    });

    it('should block early slots for appointments starting on the previous day', async () => {
      // Business open Monday 00:00–06:00, 60 min service
      mockPrismaService.business.findUnique.mockResolvedValue({
        deletedAt: null,
        openingHours: { monday: { open: '00:00', close: '06:00' } },
      });
      mockPrismaService.service.findUnique.mockResolvedValue({
        ...mockService,
        duration: 60,
      });

      // Appointment Sunday 23:00 → Monday 01:00 local Warsaw (CEST = UTC+2)
      // 23:00 Sun Warsaw = 21:00 UTC Sun, 01:00 Mon Warsaw = 23:00 UTC Sun
      const bookedStart = new Date(`${futureSunday}T21:00:00.000Z`);
      const bookedEnd = new Date(`${futureSunday}T23:00:00.000Z`);
      mockPrismaService.appointment.findMany.mockResolvedValue([
        { startTime: bookedStart, endTime: bookedEnd },
      ]);

      const result = await service.getAvailableSlots(
        businessId,
        futureMonday,
        serviceId,
      );

      // 00:00 slot ends at 01:00 — overlaps the appointment ending at 01:00
      expect(result).not.toContain('00:00');
      // 00:45 ends at 01:45 — still overlaps (appointment runs until 01:00)
      expect(result).not.toContain('00:45');
      // 01:00 slot ends at 02:00 — no overlap, appointment already finished
      expect(result).toContain('01:00');
    });
  });

  describe('update', () => {
    it('should update business if owner', async () => {
      const business = { id: 'bus-1', ownerId: 'user-1', deletedAt: null };
      mockPrismaService.business.findUnique.mockResolvedValue(business);
      mockPrismaService.business.update.mockResolvedValue({
        ...business,
        name: 'New Name',
      });

      const result = await service.update('bus-1', 'user-1', {
        name: 'New Name',
      });
      expect(result.name).toBe('New Name');
    });

    it('should throw ForbiddenException if not owner', async () => {
      const business = { id: 'bus-1', ownerId: 'user-1', deletedAt: null };
      mockPrismaService.business.findUnique.mockResolvedValue(business);

      await expect(
        service.update('bus-1', 'user-2', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
