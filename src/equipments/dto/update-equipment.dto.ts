import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEquipmentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  priceCents?: number; // Храним в копейках/центах

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  depositCents?: number; // Залог (опционально)

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsEnum(['available', 'rented', 'maintenance'])
  status?: string;
}