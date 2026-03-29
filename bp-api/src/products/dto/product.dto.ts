import { Product } from "../../entities/product.entity";

export class ProductArtistInfo {
  artistId!:        number;
  displayName!:     string;
  profileImageUrl?: string | null;
}

export class ProductLinkedTrack {
  id!:    number;
  title!: string;
}

export class ProductLinkedAlbum {
  id!:    number;
  title!: string;
}

export class ProductDto {
  id!:          number;
  name!:        string;
  type!:        "physical" | "digital";
  description?: string | null;
  price!:       number;
  artist!:      ProductArtistInfo;
  track?:       ProductLinkedTrack | null;
  album?:       ProductLinkedAlbum | null;
  createdAt!:   Date;
  updatedAt!:   Date;

  static fromEntity(product: Product): ProductDto {
    const dto         = new ProductDto();
    dto.id            = product.id;
    dto.name          = product.name;
    dto.type          = product.type;
    dto.description   = product.description ?? null;
    dto.price         = parseFloat(product.price);
    dto.artist        = {
      artistId:        product.artistId,
      displayName:     product.artist.user.displayName,
      profileImageUrl: product.artist.user.profileImageUrl ?? null,
    };
    dto.track     = product.track  ? { id: product.track.id,  title: product.track.title  } : null;
    dto.album     = product.album  ? { id: product.album.id,  title: product.album.title  } : null;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }
}
