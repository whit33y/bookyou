import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '../../generated/prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
