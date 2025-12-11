import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsOptional()
  @IsString()
  @IsEnum(['pending', 'completed', 'failed', 'refunded'])
  status?: string;
}