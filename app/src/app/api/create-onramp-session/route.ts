import { type NextRequest, NextResponse } from "next/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_API_BASE = "https://api.stripe.com/v1";

/**
 * Creates a Stripe Crypto Onramp session for the given wallet address.
 * The session is pre-configured for USDC on Solana with the wallet locked
 * so the user can't change the destination.
 *
 * POST body: { walletAddress: string, amount?: number }
 * Returns: { clientSecret: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount } = body as {
      walletAddress?: string;
      amount?: number;
    };

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 },
      );
    }

    // Create an onramp session via Stripe REST API directly
    // (the Node SDK types don't always include crypto.onramp_sessions)
    const params = new URLSearchParams();
    params.set("wallet_addresses[solana]", walletAddress);
    params.set("lock_wallet_address", "true");
    params.append("destination_currencies[]", "usdc");
    params.append("destination_networks[]", "solana");
    params.set("destination_currency", "usdc");
    params.set("destination_network", "solana");
    if (amount) params.set("source_amount", amount.toString());

    const res = await fetch(`${STRIPE_API_BASE}/crypto/onramp_sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await res.json();
    if (!res.ok) {
      console.error("[create-onramp-session] Stripe error:", session);
      return NextResponse.json(
        { error: session.error?.message ?? "Stripe error" },
        { status: res.status },
      );
    }

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error("[create-onramp-session]", err);
    return NextResponse.json(
      { error: "Failed to create onramp session" },
      { status: 500 },
    );
  }
}
