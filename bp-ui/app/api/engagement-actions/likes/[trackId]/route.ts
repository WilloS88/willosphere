export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { proxy } from "@/app/api/_proxy";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> },
) {
  const { trackId } = await params;
  return proxy(req, `/engagement-actions/likes/${trackId}`);
}
