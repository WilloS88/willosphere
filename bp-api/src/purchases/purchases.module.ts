import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Purchase } from "../entities/purchase.entity";
import { PurchaseItem } from "../entities/purchase-item.entity";
import { Product } from "../entities/product.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { PurchasesController } from "./purchases.controller";
import { PurchasesService } from "./purchases.service";

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, PurchaseItem, Product, ArtistProfile])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
