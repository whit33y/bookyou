import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../generated/prisma/client';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a review for a completed appointment' })
  @ApiResponse({ status: 201, description: 'The review has been created.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You can only review your own appointments.',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  @ApiResponse({
    status: 409,
    description: 'Appointment is not completed or already reviewed.',
  })
  create(
    @CurrentUser('id') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get('business/:businessId')
  @ApiOperation({
    summary: 'Get paginated reviews and rating stats for a business',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns reviews with average rating and review count.',
  })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  findByBusiness(
    @Param('businessId') businessId: string,
    @Query() query: FindReviewsQueryDto,
  ) {
    return this.reviewsService.findByBusiness(businessId, query);
  }
}
