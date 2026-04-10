import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Purchase } from "../entities/purchase.entity";
import { DonationsController } from "./donations.controller";
import { DonationsService } from "./donations.service";

@Module({
  imports: [TypeOrmModule.forFeature([Purchase])],
  controllers: [DonationsController],
  providers: [DonationsService],
})
export class DonationsModule {}
