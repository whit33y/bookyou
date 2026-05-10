import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsObject,
} from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, unknown>;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
