import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('rentals')
@UseGuards(AuthGuard('jwt'))
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  async findAll(@Req() req) {
    return this.rentalsService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rentalsService.findOne(parseInt(id));
  }

  @Post()
  async create(@Req() req, @Body() dto: CreateRentalDto) {
    return this.rentalsService.create(req.user.userId, dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRentalDto) {
    return this.rentalsService.update(parseInt(id), dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.rentalsService.delete(parseInt(id));
  }
}