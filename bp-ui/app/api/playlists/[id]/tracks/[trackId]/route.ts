import { NextRequest } from "next/server";
import { proxy } from "@/app/api/_proxy";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; trackId: string }> }) {
  const { id, trackId } = await params;
  return proxy(req, `/playlists/${id}/tracks/${trackId}`);
}
