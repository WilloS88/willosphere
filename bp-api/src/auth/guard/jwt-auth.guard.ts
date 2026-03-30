import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Request } from "express";
import * as jwt from "jsonwebtoken";
import { RsaKeyProvider } from "../crypto/rsa-key.provider";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly rsaKeys: RsaKeyProvider) {}

  canActivate( context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token   = this.extractToken(request);

    if(!token)
      throw new UnauthorizedException("Invalid token");

    try {
      const payload = jwt.verify(token, this.rsaKeys.publicKey, {
        algorithms: ["RS256"],
      }) as jwt.JwtPayload;

      (request as any).userId     = payload.sub;
      (request as any).userRoles  = payload.roles ?? [];
    } catch (e: any) {
      this.logger.debug(`JWT verification failed: ${e.message}`);
      throw new UnauthorizedException("Invalid or expired token");
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const cookieToken = request.cookies?.access_token;
    if(cookieToken)
      return cookieToken;

    const authHeader = request.headers.authorization;
    if(authHeader?.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    return undefined;
  }
}
