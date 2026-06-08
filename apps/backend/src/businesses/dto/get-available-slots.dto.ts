import { IsNotEmpty, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAvailableSlotsDto {
  @ApiProperty({ example: '2026-06-15' })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({ example: 'uuid-of-service' })
  @IsNotEmpty()
  @IsUUID()
  serviceId: string;
}
