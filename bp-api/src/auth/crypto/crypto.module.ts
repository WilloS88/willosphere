import { Global, Module } from "@nestjs/common";
import { RsaKeyProvider } from "./rsa-key.provider";

@Global()
@Module({
  providers: [RsaKeyProvider],
  exports: [RsaKeyProvider],
})
export class CryptoModule {}
