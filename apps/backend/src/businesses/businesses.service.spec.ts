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
      update: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
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
