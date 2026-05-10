import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('businesses/:businessId/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  create(
    @Param('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.servicesService.create(businessId, userId, createServiceDto);
  }

  @Get('businesses/:businessId/services')
  findAllByBusiness(@Param('businessId') businessId: string) {
    return this.servicesService.findAllByBusiness(businessId);
  }

  @Get('services/:id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch('services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, userId, updateServiceDto);
  }

  @Delete('services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.servicesService.remove(id, userId);
  }
}
