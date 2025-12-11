export class EquipmentAvailability {
  id: number;
  equipmentId: number;
  date: Date;
  status: string; // 'available', 'booked', 'maintenance'
  rentalId?: number;
  createdAt: Date;
  updatedAt: Date;
}