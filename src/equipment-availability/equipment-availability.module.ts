import { Module } from '@nestjs/common';
import { EquipmentAvailabilityService } from './equipment-availability.service';
import { EquipmentAvailabilityController } from './equipment-availability.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentAvailabilityController],
  providers: [EquipmentAvailabilityService],
  exports: [EquipmentAvailabilityService],
})
export class EquipmentAvailabilityModule {}