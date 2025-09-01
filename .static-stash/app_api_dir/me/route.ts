import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomer, customerUpdateProfile } from "@/lib/customer";

const COOKIE_NAME = "sf_customer_token";

export async function GET() {
  const tok = cookies().get(COOKIE_NAME)?.value || "";
  if (!tok) return NextResponse.json({ customer: null });
  try {
    const customer = await getCustomer(tok);
    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ customer: null });
  }
}

export async function POST(req: Request) {
  const tok = cookies().get(COOKIE_NAME)?.value || "";
  if (!tok) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const updated = await customerUpdateProfile(tok, {
      firstName: body?.firstName,
      lastName: body?.lastName,
      email: body?.email,
    });
    return NextResponse.json({ customer: updated });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}


