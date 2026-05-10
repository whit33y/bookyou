import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsObject,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OpeningHoursDayDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:mm format',
  })
  open: string; // HH:mm

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:mm format',
  })
  close: string; // HH:mm
}

export class OpeningHoursDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDayDto)
  monday?: OpeningHoursDayDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDayDto)
  tuesday?: OpeningHoursDayDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDayDto)
  wednesday?: OpeningHoursDayDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDayDto)
  thursday?: OpeningHoursDayDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDayDto)
  friday?: OpeningHoursDayDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDayDto)
  saturday?: OpeningHoursDayDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDayDto)
  sunday?: OpeningHoursDayDto;
}

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
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours?: OpeningHoursDto;

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
