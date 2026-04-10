import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { DonationsService } from "./donations.service";
import { CreateDonationDto } from "./dto/create-donation.dto";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";

@Controller("donations")
@UseGuards(AuthGuard)
export class DonationsController {
  constructor(private readonly donations: DonationsService) {}

  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateDonationDto,
  ): Promise<{ id: number; amount: string }> {
    return this.donations.create(req.userId, dto.amount);
  }

  @Get("my-total")
  getMyTotal(
    @Req() req: any,
  ): Promise<{ total: number; count: number }> {
    return this.donations.getMyTotal(req.userId);
  }
}
