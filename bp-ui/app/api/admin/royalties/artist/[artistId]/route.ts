export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { proxy } from "@/app/api/_proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const { artistId } = await params;
  return proxy(req, `/admin/royalties/artist/${artistId}`);
}
