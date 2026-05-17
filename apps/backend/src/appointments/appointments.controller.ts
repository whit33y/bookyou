import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { GetBookedSlotsDto } from './dto/get-booked-slots.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('booked-slots')
  @ApiOperation({ summary: 'Get booked time slots for a provider on a date' })
  @ApiResponse({ status: 200, description: 'Returns booked time slots.' })
  getBookedSlots(@Query() dto: GetBookedSlotsDto) {
    return this.appointmentsService.findBookedSlots(dto.providerId, dto.date);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({
    status: 201,
    description: 'Appointment successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 409, description: 'Conflict - double booking.' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(userId, createAppointmentDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's appointments" })
  @ApiResponse({ status: 200, description: "Returns user's appointments." })
  findMy(@CurrentUser('id') userId: string) {
    return this.appointmentsService.findMyAppointments(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointment details' })
  @ApiResponse({ status: 200, description: 'Returns appointment details.' })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.appointmentsService.findOne(id, userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiResponse({ status: 200, description: 'Status successfully updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, userId, updateStatusDto);
  }
}
