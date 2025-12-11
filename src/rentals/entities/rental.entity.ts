export class Rental {
  id: number;
  userId: number;        // ТЗ: user_id
  equipmentId: number;   // ТЗ: equipment_id
  startDate: Date;       // ТЗ: start_date
  endDate: Date;         // ТЗ: end_date
  totalCents: number;    // ТЗ: total_cents
  status: string;        // pending, active, completed, cancelled
  createdAt: Date;       // ТЗ: created_at
  updatedAt: Date;       // ТЗ: updated_at
}