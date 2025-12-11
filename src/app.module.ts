import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, // ← ДОЛЖЕН БЫТЬ ЗДЕСЬ
    UsersModule,
    EquipmentsModule,
  ],
})
export class AppModule {}