import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";
import { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate( context: ExecutionContext ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token   = this.extractToken(request);

    if(!token)
      throw new UnauthorizedException("Invalid token");

    try {
      const payload   = this.jwtService.verify(token);
      request.userId  = payload.sub;
    }
    catch(e) {
      Logger.error(e.message);
      throw new UnauthorizedException("Invalid Token");
    }
    return true;
  }

  private extractToken(request: Request): string | undefined {
    return (
      request.cookies?.access_token ??
      request.headers.authorization?.split(" ")[1]
    );
  }
}
