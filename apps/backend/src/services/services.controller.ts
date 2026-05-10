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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('businesses/:businessId/services')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, userId, updateServiceDto);
  }

  @Delete('services/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.servicesService.remove(id, userId);
  }
}
