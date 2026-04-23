import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";

const MOONPAY_SK = process.env.MOONPAY_SK ?? "";

/**
 * Signs a MoonPay widget URL with HMAC-SHA256.
 *
 * MoonPay requires URL signing when sensitive parameters (walletAddress,
 * email, etc.) are pre-filled. The signature proves the URL was generated
 * by us and not tampered with.
 *
 * POST body: { urlForSignature: string }
 * Returns: { signature: string }
 */
export async function POST(request: NextRequest) {
  if (!MOONPAY_SK) {
    return NextResponse.json(
      { error: "MOONPAY_SK not configured" },
      { status: 500 },
    );
  }

  try {
    const { urlForSignature } = (await request.json()) as {
      urlForSignature?: string;
    };

    if (!urlForSignature) {
      return NextResponse.json(
        { error: "urlForSignature is required" },
        { status: 400 },
      );
    }

    // MoonPay signing: HMAC-SHA256 of the query string (everything from '?')
    // The SDK may pass a full URL or just the query string — handle both.
    let queryString = urlForSignature;
    if (urlForSignature.includes("?")) {
      queryString = "?" + urlForSignature.split("?")[1];
    } else if (!urlForSignature.startsWith("?")) {
      queryString = "?" + urlForSignature;
    }

    console.log("[moonpay-sign] Signing query string:", queryString.substring(0, 100) + "...");

    const signature = crypto
      .createHmac("sha256", MOONPAY_SK)
      .update(queryString)
      .digest("base64");

    return NextResponse.json({ signature });
  } catch (err) {
    console.error("[moonpay-sign]", err);
    return NextResponse.json(
      { error: "Failed to sign URL" },
      { status: 500 },
    );
  }
}
