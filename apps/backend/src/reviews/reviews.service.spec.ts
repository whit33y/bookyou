import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '../generated/prisma/client';
import { ReviewSort } from './dto/find-reviews-query.dto';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockPrismaService = {
    appointment: {
      findUnique: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const clientId = 'client-1';
    const dto = { appointmentId: 'app-1', rating: 5, comment: 'Great!' };

    const completedAppointment = {
      id: 'app-1',
      clientId,
      businessId: 'bus-1',
      status: AppointmentStatus.COMPLETED,
      deletedAt: null,
      review: null,
    };

    it('should create a review for a completed, unreviewed appointment', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(
        completedAppointment,
      );
      mockPrismaService.review.create.mockResolvedValue({
        id: 'rev-1',
        ...dto,
      });

      const result = await service.create(clientId, dto);

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            rating: 5,
            comment: 'Great!',
            clientId,
            businessId: 'bus-1',
            appointmentId: 'app-1',
          },
        }),
      );
    });

    it('should throw NotFoundException if appointment does not exist', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);
      await expect(service.create(clientId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if appointment is soft-deleted', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...completedAppointment,
        deletedAt: new Date(),
      });
      await expect(service.create(clientId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the client', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...completedAppointment,
        clientId: 'someone-else',
      });
      await expect(service.create(clientId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if appointment is not completed', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...completedAppointment,
        status: AppointmentStatus.CONFIRMED,
      });
      await expect(service.create(clientId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if appointment is already reviewed', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...completedAppointment,
        review: { id: 'existing-review' },
      });
      await expect(service.create(clientId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should map a P2002 unique violation to ConflictException', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(
        completedAppointment,
      );
      mockPrismaService.review.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(clientId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rethrow unexpected errors during creation', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(
        completedAppointment,
      );
      mockPrismaService.review.create.mockRejectedValue(new Error('db down'));

      await expect(service.create(clientId, dto)).rejects.toThrow('db down');
    });
  });

  describe('findByBusiness', () => {
    it('should throw NotFoundException if the business does not exist', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);
      await expect(service.findByBusiness('bus-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return paginated reviews with rating stats', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'bus-1',
        deletedAt: null,
      });
      const reviews = [{ id: 'rev-1', rating: 5 }];
      mockPrismaService.review.findMany.mockResolvedValue(reviews);
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { _all: 2 },
      });

      const result = await service.findByBusiness('bus-1', {
        sort: ReviewSort.HIGHEST,
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        data: reviews,
        total: 2,
        limit: 10,
        offset: 0,
        averageRating: 4.5,
        reviewCount: 2,
      });
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe('getStatsForBusiness', () => {
    it('should round the average rating to one decimal place', async () => {
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.66666 },
        _count: { _all: 3 },
      });

      const result = await service.getStatsForBusiness('bus-1');

      expect(result).toEqual({ averageRating: 4.7, reviewCount: 3 });
    });

    it('should return a null average when there are no reviews', async () => {
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { _all: 0 },
      });

      const result = await service.getStatsForBusiness('bus-1');

      expect(result).toEqual({ averageRating: null, reviewCount: 0 });
    });
  });

  describe('getStatsForBusinesses', () => {
    it('should return an empty map for an empty input', async () => {
      const result = await service.getStatsForBusinesses([]);
      expect(result.size).toBe(0);
      expect(mockPrismaService.review.groupBy).not.toHaveBeenCalled();
    });

    it('should default businesses without reviews to null/zero', async () => {
      mockPrismaService.review.groupBy.mockResolvedValue([
        { businessId: 'bus-1', _avg: { rating: 5 }, _count: { _all: 4 } },
      ]);

      const result = await service.getStatsForBusinesses(['bus-1', 'bus-2']);

      expect(result.get('bus-1')).toEqual({ averageRating: 5, reviewCount: 4 });
      expect(result.get('bus-2')).toEqual({
        averageRating: null,
        reviewCount: 0,
      });
    });
  });
});
