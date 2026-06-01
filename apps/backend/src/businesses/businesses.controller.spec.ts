import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';

describe('BusinessesController', () => {
  let controller: BusinessesController;

  const mockBusinessesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByOwner: jest.fn(),
    findOne: jest.fn(),
    findServices: jest.fn(),
    getAvailableSlots: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessesController],
      providers: [
        { provide: BusinessesService, useValue: mockBusinessesService },
      ],
    }).compile();

    controller = module.get<BusinessesController>(BusinessesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should pass query params to the service', async () => {
      const query = { search: 'salon', city: 'Warsaw', limit: 10, offset: 0 };
      const paginatedResult = { data: [], total: 0, limit: 10, offset: 0 };
      mockBusinessesService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(paginatedResult);
      expect(mockBusinessesService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findMine', () => {
    it('should return business with status 200 when it exists', async () => {
      const business = {
        id: 'bus-1',
        name: 'My Salon',
        ownerId: 'user-1',
        services: [{ id: 'ser-1', name: 'Haircut' }],
      };
      mockBusinessesService.findByOwner.mockResolvedValue(business);

      const result = await controller.findMine('user-1');

      expect(result).toEqual(business);
      expect(mockBusinessesService.findByOwner).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException when no business exists', async () => {
      mockBusinessesService.findByOwner.mockResolvedValue(null);

      await expect(controller.findMine('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should require PROVIDER role via RolesGuard', () => {
      const reflector = new Reflector();
      const roles = reflector.get<string[]>(
        ROLES_KEY,
        BusinessesController.prototype.findMine,
      );
      expect(roles).toContain('PROVIDER');
    });
  });

  describe('getAvailableSlots', () => {
    it('should be a public endpoint (no role guard)', () => {
      const reflector = new Reflector();
      const roles = reflector.get<string[]>(
        ROLES_KEY,
        BusinessesController.prototype.getAvailableSlots,
      );
      expect(roles).toBeUndefined();
    });

    it('should delegate to service with correct params', async () => {
      const slots = ['09:00', '09:15', '10:00'];
      mockBusinessesService.getAvailableSlots.mockResolvedValue(slots);

      const result = await controller.getAvailableSlots('bus-1', {
        date: '2099-06-16',
        serviceId: 'ser-1',
      });

      expect(result).toEqual(slots);
      expect(mockBusinessesService.getAvailableSlots).toHaveBeenCalledWith(
        'bus-1',
        '2099-06-16',
        'ser-1',
      );
    });
  });
});
