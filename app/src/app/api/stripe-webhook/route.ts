import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe webhook for crypto onramp session updates.
 *
 * When a session reaches `fulfillment_complete`, the USDC has arrived
 * in the user's wallet. For now we log; in the future this will
 * auto-execute a buy on the bonding curve.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle crypto onramp events
  const eventType = event.type as string;
  if (eventType === "crypto.onramp_session.updated") {
    const session = event.data.object as unknown as Record<string, unknown>;
    const status = session.status as string;
    const walletAddresses = session.wallet_addresses as Record<string, string> | undefined;
    const txDetails = session.transaction_details as Record<string, unknown> | undefined;

    console.log("[stripe-webhook] Onramp session updated:", {
      id: session.id,
      status,
      wallet: walletAddresses?.solana,
      currency: txDetails?.destination_currency,
      amount: txDetails?.destination_amount,
    });

    if (status === "fulfillment_complete") {
      console.log(
        "[stripe-webhook] USDC delivered to",
        walletAddresses?.solana,
        "amount:",
        txDetails?.destination_amount,
      );
      // TODO: auto-execute buy on bonding curve
    }
  }

  return NextResponse.json({ received: true });
}
