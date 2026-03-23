import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./guard/jwt-auth.guard";
import { ConfigService } from "@nestjs/config";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { SignupAsArtistDto } from "./dto/signup-artist.dto";


@Controller("auth")
export class AuthController {
  private readonly accessCookieMaxAge:  number;
  private readonly refreshCookieMaxAge: number;
  private readonly cookieSecure:        boolean;
  private readonly cookieSameSite:      "lax" | "strict" | "none";

  constructor(
    private readonly authService:   AuthService,
    private readonly configService: ConfigService,
  ) {
    this.accessCookieMaxAge =
        this.configService.get<number>("ACCESS_COOKIE_MAX_AGE_MS", 1800000);

    this.refreshCookieMaxAge =
        this.configService.get<number>("REFRESH_COOKIE_MAX_AGE_MS", 10800000);

    this.cookieSecure =
        this.configService.get<boolean>("REFRESH_COOKIE_SECURE", false);

    this.cookieSameSite =
        this.configService.get<"lax" | "strict" | "none">(
            "REFRESH_COOKIE_SAMESITE",
            "lax",
        );
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: this.cookieSameSite,
      secure:   this.cookieSecure,
      maxAge:   this.accessCookieMaxAge,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: this.cookieSameSite,
      secure:   this.cookieSecure,
      maxAge:   this.refreshCookieMaxAge,
    });
  }

  @Post("signup")
  async signup(
      @Body() dto: CreateUserDto,
      @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.signup(dto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post("signup-artist")
  async signupAsArtist(
      @Body() dto: SignupAsArtistDto,
      @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.signupAsArtist(dto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post("login")
  async login(
      @Body() dto: LoginDto,
      @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.login(dto.email, dto.password);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post("refresh")
  async refresh(
      @Req() req: Request,
      @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if(!refreshToken)
      throw new UnauthorizedException("Missing refresh token");

    const { user, accessToken, refreshToken: newRefreshToken } =
        await this.authService.refresh(refreshToken);

    this.setAuthCookies(res, accessToken, newRefreshToken);
    return { user };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    return this.authService.me((req as any).userId);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return { ok: true };
  }
}
