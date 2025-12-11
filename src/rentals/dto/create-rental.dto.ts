import { IsNumber, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRentalDto {
  @IsNumber()
  equipmentId: number;           // ID оборудования (велосипед, лыжи)

  @IsDate()
  @Type(() => Date)
  startDate: Date;              // Дата начала аренды

  @IsDate()
  @Type(() => Date)
  endDate: Date;                // Дата окончания аренды

  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'active', 'completed', 'cancelled'])
  status?: string;              // Статус (не обязательно)
}