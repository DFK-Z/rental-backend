import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  parentId?: number; // ТЗ: parent_id для вложенных категорий
}
