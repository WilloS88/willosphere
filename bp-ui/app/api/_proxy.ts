import { NextRequest, NextResponse } from "next/server";

const NEST_API_URL = process.env.NEST_API_URL!;

/**
 * Proxy an incoming Next.js route request to the NestJS backend.
 * - Forwards cookies from the client to NestJS.
 * - Forwards Set-Cookie headers from NestJS back to the client.
 */
export async function proxy(req: NextRequest, path: string): Promise<NextResponse> {
  const url     = `${NEST_API_URL}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const cookie = req.headers.get("cookie");
  if(cookie)
    headers["Cookie"] = cookie;

  const body = req.method !== "GET" && req.method !== "HEAD"
    ? await req.text()
    : undefined;

  const nestRes = await fetch(url, { method: req.method, headers, body });
  const resBody = await nestRes.text();

  const nextRes = new NextResponse(resBody || null, {
    status:   nestRes.status,
    headers:  { "Content-Type": "application/json" },
  });

  /* Forward Set-Cookie from NestJS to the browser */
  nestRes.headers.getSetCookie().forEach((c) => {
    nextRes.headers.append("Set-Cookie", c);
  });

  return nextRes;
}
