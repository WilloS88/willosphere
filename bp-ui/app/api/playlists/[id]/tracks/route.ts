import { NextRequest } from "next/server";
import { proxy } from "@/app/api/_proxy";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy(req, `/playlists/${id}/tracks`);
}
