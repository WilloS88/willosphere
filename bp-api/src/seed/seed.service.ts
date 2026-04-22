import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { AlgorithmConfig } from "../entities/algorithm-config.entity";
import { Genre } from "../entities/genre.entity";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";
import { Role } from "../entities/role.enum";

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(AlgorithmConfig)
    private readonly configRepo: Repository<AlgorithmConfig>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly roleRepo: Repository<UserRole>,
    private readonly cfg: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.cfg.get("SEED_DB") !== "1")
      return;

    await this.seedAlgorithmConfig();
    await this.seedGenres();
    await this.seedAdminUser();
  }

  private async seedAlgorithmConfig() {
    const count = await this.configRepo.count();
    if (count > 0) return;

    const defaults: Partial<AlgorithmConfig>[] = [
      { paramKey: "F_platform",      paramValue: "0.2500", description: "Platform fee (25%)" },
      { paramKey: "D_fund_rate",     paramValue: "0.0500", description: "Discovery fund rate (5% of total revenue)" },
      { paramKey: "T_discovery",     paramValue: "1000.0000", description: "Stream threshold for discovery bonus qualification" },
      { paramKey: "T_min_listen",    paramValue: "30.0000", description: "Minimum listen duration in seconds for valid stream" },
      { paramKey: "M_action_cap",    paramValue: "1.5000", description: "Maximum action multiplier cap" },
      { paramKey: "T_min_listeners", paramValue: "10.0000", description: "Minimum unique listeners for discovery bonus" },
      { paramKey: "T_account_age",   paramValue: "24.0000", description: "Maximum artist account age in months for discovery bonus" },
    ];

    await this.configRepo.save(defaults);
    this.logger.log("Seeded algorithm_config (7 rows)");
  }

  private async seedGenres() {
    const count = await this.genreRepo.count();
    if (count > 0)
      return;

    const names = [
      "Electronic", "Hip-Hop", "Rock", "Pop", "Jazz",
      "Classical", "R&B", "Country", "Metal", "Indie",
    ];

    await this.genreRepo.save(names.map((name) => ({ name })));
    this.logger.log("Seeded genres (10 rows)");
  }

  private async seedAdminUser() {
    const existing = await this.userRepo.findOne({
      where: { email: "admin@willosphere.com" },
    });
    if (existing)
      return;

    const passwordHash = await bcrypt.hash("123", 12);

    const user = await this.userRepo.save({
      email: "admin@willosphere.com",
      passwordHash,
      displayName: "Admin",
      timezone: "Europe/Prague",
      language: "cs",
    });

    await this.roleRepo.save([
      { userId: user.id, role: Role.LISTENER },
      { userId: user.id, role: Role.ADMIN },
    ]);

    this.logger.log(`Seeded admin user (id=${user.id}, admin@willosphere.com)`);
  }
}
