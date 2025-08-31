import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomer } from "@/lib/customer";

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


