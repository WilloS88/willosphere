import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Purchase } from "../entities/purchase.entity";

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
  ) {}

  async create(
    userId: number,
    amount: number,
  ): Promise<{ id: number; amount: string }> {
    const purchase = this.purchaseRepo.create({
      userId,
      totalPrice: amount.toFixed(2),
      currencyCode: "CZK",
    });
    const saved = await this.purchaseRepo.save(purchase);
    return { id: saved.id, amount: saved.totalPrice };
  }

  async getMyTotal(userId: number): Promise<{ total: number; count: number }> {
    const [row]: [{ total: string; cnt: string }] =
      await this.purchaseRepo.query(
        `SELECT COALESCE(SUM(total_price), 0) AS total, COUNT(*) AS cnt
         FROM Purchase
         WHERE user_id = ?`,
        [userId],
      );
    return { total: Number(row.total), count: Number(row.cnt) };
  }
}
