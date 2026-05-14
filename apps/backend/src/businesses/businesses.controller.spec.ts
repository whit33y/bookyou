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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
});
