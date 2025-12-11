import { IsNumber, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRentalDto {
  @IsNumber()
  equipmentId: number;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsOptional()
  @IsEnum(['pending_payment', 'confirmed', 'active', 'completed', 'cancelled'])
  status?: string;
}