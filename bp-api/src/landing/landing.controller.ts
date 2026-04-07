import { Controller, Get } from "@nestjs/common";
import { LandingService } from "./landing.service";
import { LandingDto } from "./landing.dto";

@Controller("landing")
export class LandingController {
  constructor(private readonly landing: LandingService) {}

  @Get()
  getLanding(): Promise<LandingDto> {
    return this.landing.getLanding();
  }
}
