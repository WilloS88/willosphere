export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { proxy } from "@/app/api/_proxy";

export async function GET(req: NextRequest) {
  return proxy(req, "/auth/me");
}

export async function PATCH(req: NextRequest) {
  return proxy(req, "/auth/me");
}
