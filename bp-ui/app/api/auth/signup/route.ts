export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { proxy } from "@/app/api/_proxy";

export async function POST(req: NextRequest) {
  return proxy(req, "/auth/signup");
}
