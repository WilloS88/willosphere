import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "../entities/product.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { CloudFrontService } from "../common/cloudfront.service";

@Module({
  imports: [TypeOrmModule.forFeature([Product, ArtistProfile])],
  controllers: [ProductsController],
  providers: [ProductsService, CloudFrontService],
  exports: [ProductsService],
})
export class ProductsModule {}
