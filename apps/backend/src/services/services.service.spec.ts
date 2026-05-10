import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

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
  });
});
