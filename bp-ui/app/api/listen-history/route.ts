import { NextRequest } from "next/server";
import { proxy } from "@/app/api/_proxy";

export async function GET(req: NextRequest) {
  return proxy(req, "/listen-history");
}

export async function POST(req: NextRequest) {
  return proxy(req, "/listen-history");
}
