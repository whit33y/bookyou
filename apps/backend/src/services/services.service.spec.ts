import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ServicesService', () => {
  let service: ServicesService;

  const mockPrismaService = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a service if owner', async () => {
      const dto = { name: 'Cut', duration: 30, price: 50 };
      const businessId = 'bus-1';
      const userId = 'user-1';

      mockPrismaService.business.findUnique.mockResolvedValue({
        id: businessId,
        ownerId: userId,
        deletedAt: null,
      });
      mockPrismaService.service.create.mockResolvedValue({
        id: 'ser-1',
        ...dto,
        businessId,
      });

      const result = await service.create(businessId, userId, dto);

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.service.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner', async () => {
      const dto = { name: 'Cut', duration: 30, price: 50 };
      const businessId = 'bus-1';
      const userId = 'user-2';

      mockPrismaService.business.findUnique.mockResolvedValue({
        id: businessId,
        ownerId: 'user-1',
        deletedAt: null,
      });

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if business not found', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);
      await expect(
        service.create('bus-1', 'user-1', { name: 'x', duration: 1, price: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return service if found', async () => {
      const s = { id: 'ser-1', deletedAt: null };
      mockPrismaService.service.findUnique.mockResolvedValue(s);
      expect(await service.findOne('ser-1')).toEqual(s);
    });

    it('should throw NotFoundException if deleted', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        id: 'ser-1',
        deletedAt: new Date(),
      });
      await expect(service.findOne('ser-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update if owner', async () => {
      const s = {
        id: 'ser-1',
        deletedAt: null,
        business: { ownerId: 'user-1' },
      };
      mockPrismaService.service.findUnique.mockResolvedValue(s);
      mockPrismaService.service.update.mockResolvedValue({ ...s, name: 'new' });

      const result = await service.update('ser-1', 'user-1', { name: 'new' });
      expect(result.name).toBe('new');
    });

    it('should throw ForbiddenException if not owner', async () => {
      const s = {
        id: 'ser-1',
        deletedAt: null,
        business: { ownerId: 'user-1' },
      };
      mockPrismaService.service.findUnique.mockResolvedValue(s);
      await expect(
        service.update('ser-1', 'user-2', { name: 'new' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete if owner', async () => {
      const s = {
        id: 'ser-1',
        deletedAt: null,
        business: { ownerId: 'user-1' },
      };
      mockPrismaService.service.findUnique.mockResolvedValue(s);
      mockPrismaService.service.update.mockResolvedValue({
        ...s,
        deletedAt: new Date(),
      });

      await service.remove('ser-1', 'user-1');
      expect(mockPrismaService.service.update).toHaveBeenCalledWith({
        where: { id: 'ser-1' },
        data: { deletedAt: expect.any(Date) as Date },
      });
    });
  });
});
