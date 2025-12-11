import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEquipmentDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceCents: number; // Храним в копейках/центах

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  depositCents?: number; // Залог (опционально)

  @IsNumber()
  @Type(() => Number)
  categoryId: number;

  @IsOptional()
  @IsEnum(['available', 'rented', 'maintenance'])
  status?: string;
}
