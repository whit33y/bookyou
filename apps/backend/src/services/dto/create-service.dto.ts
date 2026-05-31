import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    description: 'Category ID to assign to this service, or null to clear',
  })
  @IsOptional()
  @ValidateIf((o: CreateServiceDto) => o.categoryId !== null)
  @IsUUID()
  categoryId?: string | null;
}
