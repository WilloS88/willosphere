import { Purchase } from "../../entities/purchase.entity";
import { PurchaseItemDto } from "./purchase-item.dto";

export class PurchaseDto {
  id!:           number;
  userId!:       number;
  purchaseDate!: Date;
  totalPrice!:   number;
  currencyCode!: string;
  items!:        PurchaseItemDto[];
  createdAt!:    Date;

  static fromEntity(purchase: Purchase): PurchaseDto {
    const dto          = new PurchaseDto();
    dto.id             = purchase.id;
    dto.userId         = purchase.userId;
    dto.purchaseDate   = purchase.purchaseDate;
    dto.totalPrice     = parseFloat(purchase.totalPrice);
    dto.currencyCode   = purchase.currencyCode;
    dto.items          = purchase.items.map(PurchaseItemDto.fromEntity);
    dto.createdAt      = purchase.createdAt;
    return dto;
  }
}
