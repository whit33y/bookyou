import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsNumber()
  @IsPositive()
  price: number;
}
