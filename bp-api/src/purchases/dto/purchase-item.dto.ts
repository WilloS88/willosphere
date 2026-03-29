import { PurchaseItem } from "../../entities/purchase-item.entity";

export class PurchaseItemArtistInfo {
  artistId!:    number;
  displayName!: string;
}

export class PurchaseItemDto {
  productId!: number;
  name!:      string;
  price!:     number;
  artist!:    PurchaseItemArtistInfo;

  static fromEntity(item: PurchaseItem): PurchaseItemDto {
    const dto     = new PurchaseItemDto();
    dto.productId = item.productId;
    dto.name      = item.product.name;
    dto.price     = parseFloat(item.price);
    dto.artist    = {
      artistId:    item.product.artistId,
      displayName: item.product.artist.user.displayName,
    };
    return dto;
  }
}
