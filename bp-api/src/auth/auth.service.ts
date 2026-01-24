import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { UsersService } from "../users/users.service";
import { RefreshToken } from "../entities/refresh-token.entity";
import { SignupDto } from "./dto/signup.dto";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class AuthService {
  private readonly refreshTokenTtlHours: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {
    this.refreshTokenTtlHours = this.configService.get<number>("REFRESH_TOKEN_TTL_HOURS", 3)

  }

  async signup(dto: SignupDto) {
    const user    = await this.usersService.create(dto);
    const tokens  = await this.issueTokens(user.id, user.email);

    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if(!existing)
      throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(password, existing.passwordHash);
    if(!valid)
      throw new UnauthorizedException("Invalid credentials");

    const user = await this.usersService.findById(existing.id);
    if(!user)
      throw new UnauthorizedException("Invalid credentials");

    const tokens = await this.issueTokens(user.id, user.email);

    return { user, ...tokens };
  }

  async refresh(refreshToken: string) {
    const stored = await this.refreshRepo.findOne({
      where: { token: refreshToken },
    });

    if(!stored)
      throw new UnauthorizedException("Invalid refresh token");

    if(stored.expiresAt.getTime() <= Date.now()) {
      await this.refreshRepo.delete({ id: stored.id });
      throw new UnauthorizedException("Refresh token expired");
    }

    await this.refreshRepo.delete({ id: stored.id });

    const user = await this.usersService.findById(stored.userId);
    if(!user)
      throw new UnauthorizedException("Invalid refresh token");

    const tokens = await this.issueTokens(user.id, user.email);

    return { user, ...tokens };
  }

  private async issueTokens(userId: number, email: string) {
    const accessToken   = await this.jwtService.signAsync({ sub: userId, email });
    const refreshToken  = uuidv4();
    const expiresAt     = new Date();
    
    expiresAt.setDate(expiresAt.getHours() + this.refreshTokenTtlHours);

    await this.refreshRepo.save({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}