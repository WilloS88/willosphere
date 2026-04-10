import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ListenHistory } from "../entities/listen-history.entity";
import { Track } from "../entities/track.entity";
import { ListenHistoryController } from "./listen-history.controller";
import { ListenHistoryService } from "./listen-history.service";
import { CloudFrontService } from "../common/cloudfront.service";
import { RoyaltyModule } from "../royalty/royalty.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ListenHistory, Track]),
    RoyaltyModule,
  ],
  controllers: [ListenHistoryController],
  providers: [ListenHistoryService, CloudFrontService],
  exports: [ListenHistoryService],
})
export class ListenHistoryModule {}
