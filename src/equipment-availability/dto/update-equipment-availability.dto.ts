import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentAvailabilityDto } from './create-equipment-availability.dto';

export class UpdateEquipmentAvailabilityDto extends PartialType(CreateEquipmentAvailabilityDto) {}
