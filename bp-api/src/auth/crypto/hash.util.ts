import { createHash, randomUUID } from "crypto";

export function sha256Base64Url(value: string): string {
  return createHash("sha256")
    .update(value, "utf-8")
    .digest("base64url");
}

export function createRefreshRaw(): string {
  return `${randomUUID()}.${randomUUID()}`;
}
