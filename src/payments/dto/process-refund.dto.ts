import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProcessRefundDto {
  @IsNumber()
  @Type(() => Number)
  paymentId: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  refundAmountCents: number;

  @IsOptional()
  @IsString()
  reason?: string; // Причина возврата
}