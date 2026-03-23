import { NextRequest } from "next/server";
import { proxy } from "@/app/api/_proxy";

export async function PATCH(req: NextRequest) {
  return proxy(req, "/artists/me");
}

export async function DELETE(req: NextRequest) {
  return proxy(req, "/artists/me");
}
