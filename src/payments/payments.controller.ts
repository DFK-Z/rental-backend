import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
// Позже добавим: import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// Позже добавим: import { RolesGuard } from '../auth/guards/roles.guard';
// Позже добавим: import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payments')
// @UseGuards(JwtAuthGuard) // Позже раскомментировать
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  // @Roles('client', 'admin') // Позже раскомментировать
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  // @Roles('admin') // Только админ видит все платежи
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('rentalId') rentalId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.paymentsService.findAll({
      type,
      status,
      rentalId: rentalId ? +rentalId : undefined,
      userId: userId ? +userId : undefined,
    });
  }

  @Get('report')
  // @Roles('admin')
  getReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.paymentsService.getFinancialReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('user/:userId')
  // @UseGuards(JwtAuthGuard) // Пользователь видит только свои
  getUserPayments(@Param('userId') userId: string) {
    return this.paymentsService.getUserPayments(+userId);
  }

  @Get(':id')
  // @Roles('client', 'admin')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Patch(':id')
  // @Roles('admin') // Только админ может обновлять
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  // @Roles('admin') // Только админ может удалять
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }

  @Post('refund')
  // @Roles('admin') // Только админ может делать возвраты
  processRefund(@Body() refundDto: ProcessRefundDto) {
    return this.paymentsService.processRefund(refundDto);
  }
}