import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new business profile' })
  @ApiResponse({
    status: 201,
    description: 'The business has been successfully created.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only providers can create businesses.',
  })
  create(
    @CurrentUser('id') userId: string,
    @Body() createBusinessDto: CreateBusinessDto,
  ) {
    return this.businessesService.create(userId, createBusinessDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses' })
  @ApiResponse({ status: 200, description: 'Returns all active businesses.' })
  findAll() {
    return this.businessesService.findAll();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated provider's business" })
  @ApiResponse({
    status: 200,
    description: "Returns the provider's business with services.",
  })
  @ApiResponse({
    status: 404,
    description: 'Provider has no business yet.',
  })
  async findMine(@CurrentUser('id') userId: string) {
    const business = await this.businessesService.findByOwner(userId);
    if (!business) {
      throw new NotFoundException('Business not found for this provider');
    }
    return business;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a business by ID' })
  @ApiResponse({ status: 200, description: 'Returns the business details.' })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Get all services for a specific business' })
  @ApiResponse({
    status: 200,
    description: 'Returns all active services for the business.',
  })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  findServices(@Param('id') id: string) {
    return this.businessesService.findServices(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a business profile' })
  @ApiResponse({
    status: 200,
    description: 'The business has been successfully updated.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You are not the owner.',
  })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, userId, updateBusinessDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a business profile (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'The business has been successfully deleted.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You are not the owner.',
  })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.businessesService.remove(id, userId);
  }
}
