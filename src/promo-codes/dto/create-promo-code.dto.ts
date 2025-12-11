import { IsString, IsEnum, IsInt, IsDate, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePromoCodeDto {
  @IsString()
  code: string;

  @IsEnum(['percentage', 'fixed'])
  discountType: string;

  @IsInt()
  @Min(1)
  discountValue: number;

  @IsDate()
  @Type(() => Date)
  validFrom: Date;

  @IsDate()
  @Type(() => Date)
  validUntil: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}