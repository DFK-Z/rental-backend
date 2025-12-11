import { PartialType } from '@nestjs/mapped-types';
import { CreateRentalDto } from './create-rental.dto';
import { IsDate, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRentalDto extends PartialType(CreateRentalDto) {
  @IsNumber()
  @IsOptional()
  equipmentId?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(['pending_payment', 'confirmed', 'active', 'completed', 'cancelled'])
  status?: string;
}