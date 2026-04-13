export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { proxy } from "@/app/api/_proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  return proxy(req, `/admin/algorithm-config/${key}`);
}
