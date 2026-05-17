import { IsNotEmpty, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetBookedSlotsDto {
  @ApiProperty({ example: 'uuid-of-provider' })
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  @ApiProperty({ example: '2026-05-18' })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;
}
