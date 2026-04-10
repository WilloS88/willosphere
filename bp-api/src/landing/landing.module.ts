import { Module } from "@nestjs/common";
import { TracksModule } from "../tracks/tracks.module";
import { LandingController } from "./landing.controller";
import { LandingService } from "./landing.service";
import { CloudFrontService } from "../common/cloudfront.service";

@Module({
  imports:     [TracksModule],
  controllers: [LandingController],
  providers:   [LandingService, CloudFrontService],
})
export class LandingModule {}
