import { Module } from '@nestjs/common';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [JwtModule, PrismaModule, PassportModule],
  controllers: [EquipmentsController],
  providers: [EquipmentsService],
})
export class EquipmentsModule {}
