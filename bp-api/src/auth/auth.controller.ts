import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Response, Request } from "express";
import { randomUUID } from "crypto";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./guard/jwt-auth.guard";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { SignupAsArtistDto } from "./dto/signup-artist.dto";
import { MfaVerifyDto } from "./dto/mfa.dto";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { UsersService } from "../users/users.service";

class PatchMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  displayName?: string;
}

const COOKIE_ACCESS_TOKEN   = "access_token";
const COOKIE_REFRESH_TOKEN  = "refresh_token";
const COOKIE_DEVICE_ID      = "device_id";

@Controller("auth")
export class AuthController {
  private readonly accessCookieMaxAge:  number;
  private readonly refreshCookieMaxAge: number;
  private readonly deviceCookieMaxAge:  number;
  private readonly cookieSecure:        boolean;
  private readonly cookieSameSite:      "lax" | "strict" | "none";

  constructor(
    private readonly authService:   AuthService,
    private readonly configService: ConfigService,
    private readonly usersService:  UsersService,
  ) {
    this.accessCookieMaxAge =
        this.configService.get<number>("ACCESS_COOKIE_MAX_AGE_MS", 1800000);

    this.refreshCookieMaxAge =
        this.configService.get<number>("REFRESH_COOKIE_MAX_AGE_MS", 10800000);

    this.deviceCookieMaxAge = this.refreshCookieMaxAge;

    this.cookieSecure =
        this.configService.get<boolean>("REFRESH_COOKIE_SECURE", false);

    this.cookieSameSite =
        this.configService.get<"lax" | "strict" | "none">(
            "REFRESH_COOKIE_SAMESITE",
            "lax",
        );
  }

  private setAuthCookies(
    res:          Response,
    accessToken:  string,
    refreshToken: string,
    deviceId:     string
  ) {
    const cookieOptions = {
      httpOnly: true,
      sameSite: this.cookieSameSite as boolean | "lax" | "strict" | "none",
      secure: this.cookieSecure,
    };

    res.cookie(COOKIE_ACCESS_TOKEN, accessToken, {
      ...cookieOptions,
      maxAge: this.accessCookieMaxAge,
    });

    res.cookie(COOKIE_REFRESH_TOKEN, refreshToken, {
      ...cookieOptions,
      maxAge: this.refreshCookieMaxAge,
    });

    res.cookie(COOKIE_DEVICE_ID, deviceId, {
      ...cookieOptions,
      maxAge: this.deviceCookieMaxAge,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(COOKIE_ACCESS_TOKEN);
    res.clearCookie(COOKIE_REFRESH_TOKEN);
    res.clearCookie(COOKIE_DEVICE_ID);
  }

  private getOrCreateDeviceId(req: Request): string {
    return req.cookies?.[COOKIE_DEVICE_ID] || randomUUID();
  }

  @Post("signup")
  async signup(
      @Body() dto: CreateUserDto,
      @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken, deviceId } =
      await this.authService.signup(dto);

    this.setAuthCookies(res, accessToken, refreshToken, deviceId);
    return { user };
  }

  @Post("signup-artist")
  async signupAsArtist(
      @Body() dto: SignupAsArtistDto,
      @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken, deviceId } =
      await this.authService.signupAsArtist(dto);

    this.setAuthCookies(res, accessToken, refreshToken, deviceId);
    return { user };
  }

  @Post("login")
  async login(
      @Body() dto: LoginDto,
      @Req() req: Request,
      @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = this.getOrCreateDeviceId(req);

    const result = await this.authService.login(dto.email, dto.password, deviceId);

    if (result.mfaRequired) {
      res.cookie(COOKIE_DEVICE_ID, deviceId, {
        httpOnly: true,
        sameSite: this.cookieSameSite as boolean | "lax" | "strict" | "none",
        secure: this.cookieSecure,
        maxAge: this.deviceCookieMaxAge,
      });

      return {
        mfaRequired: true,
        challengeId: result.challengeId,
      };
    }

    this.setAuthCookies(res, result.accessToken!, result.refreshToken!, result.deviceId!);
    return { user: result.user };
  }

  @Post("verify-login")
  async verifyLogin(
    @Body() dto: MfaVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = this.getOrCreateDeviceId(req);

    const { user, accessToken, refreshToken } =
      await this.authService.verifyMfaLogin(dto.challengeId, dto.code, deviceId);

    this.setAuthCookies(res, accessToken, refreshToken, deviceId);
    return { user };
  }

  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[COOKIE_REFRESH_TOKEN];
    const deviceId = req.cookies?.[COOKIE_DEVICE_ID];

    if(!refreshToken)
      throw new UnauthorizedException("Missing refresh token");

    if(!deviceId)
      throw new UnauthorizedException("Missing device ID");

    const {
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    } = await this.authService.refresh(refreshToken, deviceId);

    this.setAuthCookies(res, newAccessToken, newRefreshToken, deviceId);
    return { user };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    return this.authService.me((req as any).userId);
  }

  @Patch("me")
  @UseGuards(AuthGuard)
  async patchMe(@Req() req: Request, @Body() dto: PatchMeDto) {
    const userId = (req as any).userId as number;
    await this.usersService.update(userId, dto);
    return this.authService.me(userId);
  }

  @Post("logout")
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[COOKIE_REFRESH_TOKEN];
    await this.authService.logout(refreshToken);

    this.clearAuthCookies(res);
    return { ok: true };
  }
}
