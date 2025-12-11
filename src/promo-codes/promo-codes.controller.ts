import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post()
  create(@Body() createPromoCodeDto: CreatePromoCodeDto) {
    return this.promoCodesService.create(createPromoCodeDto);
  }

  @Get()
  findAll() {
    return this.promoCodesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promoCodesService.findOne(+id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.promoCodesService.findByCode(code);
  }

  @Post('validate/:code')
  @HttpCode(HttpStatus.OK)
  validate(@Param('code') code: string) {
    return this.promoCodesService.validatePromoCode(code);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePromoCodeDto: UpdatePromoCodeDto) {
    return this.promoCodesService.update(+id, updatePromoCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoCodesService.remove(+id);
  }
}