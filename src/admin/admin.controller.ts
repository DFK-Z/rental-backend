import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // Только админы
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== ОТЧЁТЫ ====================

  @Get('reports/inventory-load')
  getInventoryLoadReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminService.getInventoryLoadReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('reports/financial')
  getFinancialReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminService.getFinancialReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('reports/popular-equipment')
  getPopularEquipment(@Query('limit') limit: string) {
    return this.adminService.getPopularEquipment(limit ? +limit : 10);
  }

  @Get('reports/user-stats')
  getUserStats() {
    return this.adminService.getUserStats();
  }

  // ==================== УПРАВЛЕНИЕ ====================

  @Post('promo-codes')
  createPromoCode(@Body() data: any) {
    return this.adminService.createPromoCode(data);
  }

  @Post('export/pdf')
  exportToPDF(@Body() data: any) {
    return this.adminService.exportToPDF(data);
  }

  // ==================== СИСТЕМНАЯ ИНФОРМАЦИЯ ====================

  @Get('system/stats')
  getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }
}