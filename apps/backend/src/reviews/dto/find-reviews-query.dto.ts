import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReviewSort {
  NEWEST = 'newest',
  HIGHEST = 'highest',
  LOWEST = 'lowest',
}

export class FindReviewsQueryDto {
  @ApiPropertyOptional({
    enum: ReviewSort,
    default: ReviewSort.NEWEST,
    description: 'Sort order for the reviews',
  })
  @IsOptional()
  @IsEnum(ReviewSort)
  sort?: ReviewSort = ReviewSort.NEWEST;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
