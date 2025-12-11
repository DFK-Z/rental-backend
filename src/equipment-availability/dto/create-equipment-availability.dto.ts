import { IsInt, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEquipmentAvailabilityDto {
  @IsInt()
  equipmentId: number;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsEnum(['available', 'booked', 'maintenance'])
  status: string;

  @IsOptional()
  @IsInt()
  rentalId?: number;
}
