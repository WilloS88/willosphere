import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StreamEvent } from "../entities/stream-event.entity";
import { EngagementAction } from "../entities/engagement-action.entity";
import { MonthlyRoyalty } from "../entities/monthly-royalty.entity";
import { AlgorithmConfig } from "../entities/algorithm-config.entity";
import { TrackArtist } from "../entities/track-artist.entity";
import { Track } from "../entities/track.entity";
import { StreamEventService } from "./stream-event.service";
import { EngagementActionService } from "./engagement-action.service";
import { RoyaltyCalculationService } from "./royalty-calculation.service";
import { EngagementController } from "./engagement.controller";
import { RoyaltyController } from "./royalty.controller";
import { PlaylistsModule } from "../playlists/playlists.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StreamEvent,
      EngagementAction,
      MonthlyRoyalty,
      AlgorithmConfig,
      TrackArtist,
      Track,
    ]),
    forwardRef(() => PlaylistsModule),
  ],
  controllers: [EngagementController, RoyaltyController],
  providers: [
    StreamEventService,
    EngagementActionService,
    RoyaltyCalculationService,
  ],
  exports: [StreamEventService, EngagementActionService],
})
export class RoyaltyModule {}
