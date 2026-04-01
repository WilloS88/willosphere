import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminStatsService } from "./admin-stats.service";
import { AdminStatsDto } from "./dto/admin-stats.dto";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../entities/role.enum";

@Controller("admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get("stats")
  getStats(): Promise<AdminStatsDto> {
    return this.stats.getStats();
  }
}
