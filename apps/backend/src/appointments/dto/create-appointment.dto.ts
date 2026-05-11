import { IsNotEmpty, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: '2026-05-11T10:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: 'uuid-of-service' })
  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: 'uuid-of-business' })
  @IsNotEmpty()
  @IsUUID()
  businessId: string;

  @ApiProperty({ example: 'uuid-of-provider' })
  @IsNotEmpty()
  @IsUUID()
  providerId: string;
}
