import { createPrivateKey, createPublicKey, KeyObject } from "crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RsaKeyProvider {
  public readonly privateKey: KeyObject;
  public readonly publicKey: KeyObject;

  constructor(private readonly configService: ConfigService) {
    const privatePem  = this.configService.get<string>("JWT_PRIVATE_KEY_PEM");
    const publicPem   = this.configService.get<string>("JWT_PUBLIC_KEY_PEM");

    if(!privatePem || !publicPem) {
      throw new Error(
        "Missing JWT_PRIVATE_KEY_PEM or JWT_PUBLIC_KEY_PEM environment variables. " +
        "See IMPLEMENTATION_GUIDE.md for how to generate RSA keys."
      );
    }

    this.privateKey = createPrivateKey(privatePem.replace(/\\n/g, "\n"));
    this.publicKey = createPublicKey(publicPem.replace(/\\n/g, "\n"));
  }
}
