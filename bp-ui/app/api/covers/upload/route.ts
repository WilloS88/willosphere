export const dynamic = "force-dynamic";
import { uploadCoverToS3 } from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const key = await uploadCoverToS3(Buffer.from(buffer), file.name, file.type);

    return NextResponse.json({ key });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
