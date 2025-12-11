export class PromoCode {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}