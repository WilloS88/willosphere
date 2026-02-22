import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";


@Controller("auth")
export class AuthController {
  private readonly cookieMaxAge: number;
  private readonly cookieSecure: boolean;
  private readonly cookieSameSite: "lax" | "strict" | "none";

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.cookieMaxAge =
        this.configService.get<number>("REFRESH_COOKIE_MAX_AGE_MS", 10800000);

    this.cookieSecure =
        this.configService.get<boolean>("REFRESH_COOKIE_SECURE", false);

    this.cookieSameSite =
        this.configService.get<"lax" | "strict" | "none">(
            "REFRESH_COOKIE_SAMESITE",
            "lax",
        );
  }

  @Post("signup")
  signup(@Body() dto: CreateUserDto) {
    return this.authService.signup(dto);
  }

  @Post("login")
  async login(
      @Body() dto: LoginDto,
      @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.login(dto.email, dto.password);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: this.cookieSameSite,
      secure:   this.cookieSecure,
      maxAge:   this.cookieMaxAge
    });

    return { user, accessToken };
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

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      sameSite: this.cookieSameSite,
      secure:   this.cookieSecure,
      maxAge:   this.cookieMaxAge,
    });

    return { user, accessToken };
  }
}
