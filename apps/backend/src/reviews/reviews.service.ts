import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsQueryDto, ReviewSort } from './dto/find-reviews-query.dto';

export interface RatingStats {
  averageRating: number | null;
  reviewCount: number;
}

const REVIEW_AUTHOR_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

/** Rounds an average rating to one decimal place (e.g. 4.6666 -> 4.7). */
function roundRating(value: number | null): number | null {
  return value === null ? null : Math.round(value * 10) / 10;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, dto: CreateReviewDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { review: true },
    });

    if (!appointment || appointment.deletedAt) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.clientId !== clientId) {
      throw new ForbiddenException('You can only review your own appointments');
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new ConflictException('You can only review completed appointments');
    }

    if (appointment.review) {
      throw new ConflictException('This appointment has already been reviewed');
    }

    try {
      return await this.prisma.review.create({
        data: {
          rating: dto.rating,
          comment: dto.comment,
          clientId,
          businessId: appointment.businessId,
          appointmentId: appointment.id,
        },
        include: { client: { select: REVIEW_AUTHOR_SELECT } },
      });
    } catch (error) {
      // Guards against a race where two concurrent submissions both pass the
      // check above; the unique constraint on appointmentId raises P2002.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This appointment has already been reviewed',
        );
      }
      throw error;
    }
  }

  async findByBusiness(businessId: string, query: FindReviewsQueryDto) {
    const { sort = ReviewSort.NEWEST, limit = 10, offset = 0 } = query;

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, deletedAt: true },
    });

    if (!business || business.deletedAt) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    const where: Prisma.ReviewWhereInput = { businessId };

    const [data, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { client: { select: REVIEW_AUTHOR_SELECT } },
        orderBy: this.buildOrderBy(sort),
        skip: offset,
        take: limit,
      }),
      this.getStatsForBusiness(businessId),
    ]);

    return {
      data,
      total: stats.reviewCount,
      limit,
      offset,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount,
    };
  }

  /** Aggregated rating stats for a single business. */
  async getStatsForBusiness(businessId: string): Promise<RatingStats> {
    const aggregate = await this.prisma.review.aggregate({
      where: { businessId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      averageRating: roundRating(aggregate._avg.rating),
      reviewCount: aggregate._count._all,
    };
  }

  /**
   * Aggregated rating stats for many businesses in a single query. Businesses
   * without reviews are returned with a zero count and null average.
   */
  async getStatsForBusinesses(
    businessIds: string[],
  ): Promise<Map<string, RatingStats>> {
    const stats = new Map<string, RatingStats>(
      businessIds.map((id) => [id, { averageRating: null, reviewCount: 0 }]),
    );

    if (businessIds.length === 0) {
      return stats;
    }

    const grouped = await this.prisma.review.groupBy({
      by: ['businessId'],
      where: { businessId: { in: businessIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });

    for (const group of grouped) {
      stats.set(group.businessId, {
        averageRating: roundRating(group._avg.rating),
        reviewCount: group._count._all,
      });
    }

    return stats;
  }

  private buildOrderBy(
    sort: ReviewSort,
  ): Prisma.ReviewOrderByWithRelationInput[] {
    switch (sort) {
      case ReviewSort.HIGHEST:
        return [{ rating: 'desc' }, { createdAt: 'desc' }];
      case ReviewSort.LOWEST:
        return [{ rating: 'asc' }, { createdAt: 'desc' }];
      case ReviewSort.NEWEST:
      default:
        return [{ createdAt: 'desc' }];
    }
  }
}
