import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { MfaService } from "./mfa.service";
import { MfaConfirmDto } from "../dto/mfa.dto";
import { AuthGuard } from "../guard/jwt-auth.guard";

@Controller("mfa")
@UseGuards(AuthGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get("status")
  async status(@Req() req: Request) {
    const userId = (req as any).userId;
    const enabled = await this.mfaService.isMfaEnabled(userId);
    return { enabled };
  }

  @Post("enroll")
  async enroll(@Req() req: Request) {
    const userId = (req as any).userId;
    return this.mfaService.enroll(userId);
  }

  @Post("confirm")
  async confirm(
    @Req() req: Request,
    @Body() dto: MfaConfirmDto,
  ) {
    const userId = (req as any).userId;
    await this.mfaService.confirmEnrollment(userId, dto.code);
    return { ok: true, message: "MFA successfully enabled" };
  }
}
