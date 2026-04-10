import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../entities/role.enum";
import { MonthlyRoyalty } from "../entities/monthly-royalty.entity";
import { AlgorithmConfig } from "../entities/algorithm-config.entity";
import { RoyaltyCalculationService } from "./royalty-calculation.service";
import { CalculateRoyaltiesDto } from "./dto/calculate-royalties.dto";
import { UpdateAlgorithmConfigDto } from "./dto/update-algorithm-config.dto";

@Controller("admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class RoyaltyController {
  constructor(
    private readonly calculationService: RoyaltyCalculationService,
    @InjectRepository(MonthlyRoyalty)
    private readonly royaltyRepo: Repository<MonthlyRoyalty>,
    @InjectRepository(AlgorithmConfig)
    private readonly configRepo: Repository<AlgorithmConfig>,
  ) {}

  @Post("royalties/calculate")
  async calculate(@Body() dto: CalculateRoyaltiesDto): Promise<{ message: string }> {
    await this.calculationService.calculateMonthlyRoyalties(dto.month);
    return { message: `Royalties calculated for ${dto.month}` };
  }

  @Get("royalties")
  async listRoyalties(
    @Query("month") month?: string,
  ): Promise<MonthlyRoyalty[]> {
    const qb = this.royaltyRepo
      .createQueryBuilder("mr")
      .leftJoinAndSelect("mr.artist", "u")
      .orderBy("mr.totalPayout", "DESC");

    if(month) {
      qb.where("mr.month = :month", { month: `${month}-01` });
    }

    return qb.getMany();
  }

  @Get("royalties/artist/:artistId")
  async artistRoyalties(
    @Param("artistId", ParseIntPipe) artistId: number,
  ): Promise<MonthlyRoyalty[]> {
    return this.royaltyRepo.find({
      where: { artistId },
      order: { month: "DESC" },
    });
  }

  @Get("algorithm-config")
  async listConfig(): Promise<AlgorithmConfig[]> {
    return this.configRepo.find({ order: { paramKey: "ASC" } });
  }

  @Patch("algorithm-config/:key")
  async updateConfig(
    @Param("key") key: string,
    @Body() dto: UpdateAlgorithmConfigDto,
  ): Promise<AlgorithmConfig> {
    const config      = await this.configRepo.findOneByOrFail({ paramKey: key });
    config.paramValue = dto.paramValue.toFixed(4);

    if(dto.description !== undefined) {
      config.description = dto.description;
    }
    return this.configRepo.save(config);
  }
}
