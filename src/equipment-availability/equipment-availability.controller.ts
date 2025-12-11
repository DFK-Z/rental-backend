import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { EquipmentAvailabilityService } from './equipment-availability.service';
import { CreateEquipmentAvailabilityDto } from './dto/create-equipment-availability.dto';
import { UpdateEquipmentAvailabilityDto } from './dto/update-equipment-availability.dto';

@Controller('equipment-availability')
export class EquipmentAvailabilityController {
  constructor(private readonly availabilityService: EquipmentAvailabilityService) {}

  @Post()
  create(@Body() createDto: CreateEquipmentAvailabilityDto) {
    return this.availabilityService.create(createDto);
  }

  @Get()
  findAll() {
    return this.availabilityService.findAll();
  }

  @Get('equipment/:equipmentId')
  findByEquipmentId(@Param('equipmentId') equipmentId: string) {
    return this.availabilityService.findByEquipmentId(+equipmentId);
  }

  @Get('check-availability/:equipmentId')
  checkAvailability(
    @Param('equipmentId') equipmentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.availabilityService.checkAvailability(
      +equipmentId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.availabilityService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEquipmentAvailabilityDto) {
    return this.availabilityService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.availabilityService.remove(+id);
  }

  @Post('bulk-update-rental')
  @HttpCode(HttpStatus.OK)
  bulkUpdateForRental(
    @Body() body: {
      equipmentId: number;
      rentalId: number;
      startDate: Date;
      endDate: Date;
      status: string;
    },
  ) {
    return this.availabilityService.bulkUpdateForRental(
      body.equipmentId,
      body.rentalId,
      body.startDate,
      body.endDate,
      body.status,
    );
  }
}