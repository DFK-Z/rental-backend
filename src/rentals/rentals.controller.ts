import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('rentals')
@UseGuards(JwtAuthGuard, RolesGuard) // Защищаем весь контроллер
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @Roles('client', 'admin') // Только клиенты и админы могут бронировать
  create(@Body() createRentalDto: CreateRentalDto, @Request() req) {
    const userId = req.user.id; // Теперь из JWT токена
    return this.rentalsService.create(userId, createRentalDto);
  }

  @Get()
  @Roles('admin') // Только админ видит все бронирования
  findAll(@Query('userId') userId?: string) {
    return this.rentalsService.findAll(userId ? +userId : undefined, 'admin');
  }

  @Get('my-rentals')
  @Roles('client', 'admin') // Свои бронирования видят все авторизованные
  getMyRentals(@Request() req) {
    return this.rentalsService.getUserRentals(req.user.id);
  }

  @Get('equipment/:equipmentId')
  @Roles('admin') // Только админ видит все бронирования оборудования
  getEquipmentRentals(@Param('equipmentId') equipmentId: string) {
    return this.rentalsService.getEquipmentRentals(+equipmentId);
  }

  @Get(':id')
  @Roles('client', 'admin')
  findOne(@Param('id') id: string, @Request() req) {
    return this.rentalsService.findOne(+id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles('client', 'admin')
  update(
    @Param('id') id: string,
    @Body() updateRentalDto: UpdateRentalDto,
    @Request() req,
  ) {
    return this.rentalsService.update(+id, updateRentalDto, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  @Roles('admin') // Только админ меняет статусы
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.rentalsService.updateStatus(+id, status);
  }

  @Delete(':id')
  @Roles('client', 'admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.rentalsService.remove(+id, req.user.id, req.user.role);
  }
}