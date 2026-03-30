import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AesGcmCrypto {
  private readonly keyBuffer: Buffer;

  constructor(private readonly configService: ConfigService) {
    const base64Key = this.configService.get<string>("MFA_SECRET_KEY_BASE64");

    if(!base64Key) {
      throw new Error(
        "Missing MFA_SECRET_KEY_BASE64 environment variable. " +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
      );
    }

    this.keyBuffer = Buffer.from(base64Key, "base64");

    if(this.keyBuffer.length !== 32) {
      throw new Error(
        `MFA_SECRET_KEY_BASE64 must decode to exactly 32 bytes (got ${this.keyBuffer.length})`
      );
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);

    const cipher = createCipheriv("aes-256-gcm", this.keyBuffer, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf-8"),
      cipher.final(),
    ]);
    const authTag   = cipher.getAuthTag();
    const output    = Buffer.concat([iv, encrypted, authTag]);

    return output.toString("base64");
  }

  decrypt(base64Ciphertext: string): string {
    const input       = Buffer.from(base64Ciphertext, "base64");
    const iv          = input.subarray(0, 12);
    const authTag     = input.subarray(input.length - 16);
    const ciphertext  = input.subarray(12, input.length - 16);
    const decipher    = createDecipheriv("aes-256-gcm", this.keyBuffer, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf-8");
  }
}
