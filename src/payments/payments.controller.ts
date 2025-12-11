import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles('client', 'admin')
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @Roles('admin') // Только админ
  findAll(@Query() filters: any) {
    return this.paymentsService.findAll(filters);
  }

  @Get('my-payments')
  @Roles('client', 'admin')
  getMyPayments(@Request() req) {
    return this.paymentsService.getUserPayments(req.user.id);
  }

  @Get('report')
  @Roles('admin')
  getReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.paymentsService.getFinancialReport(new Date(startDate), new Date(endDate));
  }

  @Get(':id')
  @Roles('client', 'admin')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }

  @Post('refund')
  @Roles('admin')
  processRefund(@Body() refundDto: ProcessRefundDto) {
    return this.paymentsService.processRefund(refundDto);
  }
}