import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { customerCreate, customerAccessTokenCreate, customerAccessTokenDelete } from "@/lib/customer";

const COOKIE_NAME = "sf_customer_token";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action as string;
  const secure = (req.nextUrl?.protocol === "https:" ) || process.env.NODE_ENV === "production";
  try {
    if (action === "signup") {
      const { email, password, firstName, lastName } = body || {};
      if (!email || !password) return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
      await customerCreate({ email, password, firstName, lastName });
      // Auto-login after signup
      const token = await customerAccessTokenCreate({ email, password });
      cookies().set(COOKIE_NAME, token.accessToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
      return NextResponse.json({ ok: true });
    }
    if (action === "login") {
      const { email, password } = body || {};
      if (!email || !password) return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
      const token = await customerAccessTokenCreate({ email, password });
      cookies().set(COOKIE_NAME, token.accessToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
      return NextResponse.json({ ok: true });
    }
    if (action === "logout") {
      const cookie = cookies().get(COOKIE_NAME);
      if (cookie?.value) {
        try { await customerAccessTokenDelete(cookie.value); } catch {}
      }
      cookies().delete(COOKIE_NAME);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}


