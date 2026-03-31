import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

@Injectable()
export class CloudFrontService {
  private readonly domain: string;
  private readonly keyPairId: string;
  private readonly privateKey: string;

  constructor(private readonly config: ConfigService) {
    this.domain     = config.getOrThrow<string>("CLOUDFRONT_DOMAIN");
    this.keyPairId  = config.getOrThrow<string>("CLOUDFRONT_KEY_PAIR_ID");
    const pem       = config.getOrThrow<string>("CLOUDFRONT_PRIVATE_KEY_PEM");

    this.privateKey = pem.replace(/\\n/g, "\n");
  }

  signUrl(s3KeyOrUrl: string, expiresInSeconds = 3600): string {
    const key = this.extractKey(s3KeyOrUrl);
    const url = `https://${this.domain}/${key}`;

    return getSignedUrl({
      url,
      keyPairId: this.keyPairId,
      privateKey: this.privateKey,
      dateLessThan: new Date(
        Date.now() + expiresInSeconds * 1000,
      ).toISOString(),
    });
  }

  private extractKey(input: string): string {
    if (input.startsWith("http")) {
      const url = new URL(input);
      return url.pathname.startsWith("/")
        ? url.pathname.slice(1)
        : url.pathname;
    }
    return input.startsWith("/") ? input.slice(1) : input;
  }
}
