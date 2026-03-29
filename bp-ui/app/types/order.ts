export type PurchaseItemArtistInfo = {
  artistId:    number;
  displayName: string;
};

export type PurchaseItemDto = {
  productId: number;
  name:      string;
  price:     number;
  artist:    PurchaseItemArtistInfo;
};

export type PurchaseDto = {
  id:           number;
  userId:       number;
  purchaseDate: string;
  totalPrice:   number;
  currencyCode: string;
  items:        PurchaseItemDto[];
  createdAt:    string;
};
