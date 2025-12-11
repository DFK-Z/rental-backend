import { IsNumber, IsString, IsEnum, Min, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsNumber()
  @Type(() => Number)
  rentalId: number;

  @IsNumber()
  @Min(1, { message: 'Сумма должна быть больше 0' })
  @Type(() => Number)
  amountCents: number;

  @IsString()
  @IsEnum(['deposit', 'payment', 'refund', 'penalty'], {
    message: 'Тип должен быть: deposit, payment, refund или penalty',
  })
  type: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>; // Для хранения ID транзакции и т.д.
}
