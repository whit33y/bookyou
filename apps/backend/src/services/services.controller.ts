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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('businesses/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service for a business' })
  @ApiResponse({
    status: 201,
    description: 'The service has been successfully created.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You are not the owner of the business.',
  })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  create(
    @Param('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.servicesService.create(businessId, userId, createServiceDto);
  }

  @Get('businesses/:businessId')
  @ApiOperation({ summary: 'Get all services for a specific business' })
  @ApiResponse({
    status: 200,
    description: 'Returns all active services for the business.',
  })
  findAllByBusiness(@Param('businessId') businessId: string) {
    return this.servicesService.findAllByBusiness(businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, description: 'Returns the service details.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({
    status: 200,
    description: 'The service has been successfully updated.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You are not the owner.',
  })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, userId, updateServiceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'The service has been successfully deleted.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You are not the owner.',
  })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.servicesService.remove(id, userId);
  }
}
