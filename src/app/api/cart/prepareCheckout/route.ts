import { NextResponse } from "next/server";
import { cartBuyerIdentityUpdate, cartGet } from "@/lib/cart";
import { ensureCheckoutHost } from "@/lib/checkout";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { cartId, buyer } = body as { cartId?: string; buyer?: { email?: string; countryCode?: string } };
    if (!cartId) return NextResponse.json({ error: "Missing cartId" }, { status: 400 });

    if (buyer && (buyer.email || buyer.countryCode)) {
      try { await cartBuyerIdentityUpdate(cartId, buyer as any); } catch {}
    }

    const fresh = await cartGet(cartId);
    const checkoutUrl = ensureCheckoutHost(fresh.checkoutUrl);
    return NextResponse.json({ checkoutUrl }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to prepare checkout" }, { status: 500 });
  }
}


