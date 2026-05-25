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
      mockPrismaService.$transaction.mockResolvedValue([businesses, 2]);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: businesses,
        total: 2,
        limit: 20,
        offset: 0,
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should apply search filter on name', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[businesses[0]], 1]);

      const result = await service.findAll({ search: 'Salon A' });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply city filter', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[businesses[1]], 1]);

      const result = await service.findAll({ city: 'Krakow' });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply category filter via services relation', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[businesses[0]], 1]);

      const result = await service.findAll({ category: 'Haircut' });

      expect(result.data).toHaveLength(1);
    });

    it('should respect limit and offset', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[businesses[0]], 2]);

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
