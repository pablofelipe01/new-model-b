import { type NextRequest, NextResponse } from "next/server";

/**
 * Minimal metadata JSON endpoint. The on-chain Metaplex metadata already
 * stores name + symbol, so wallets read those directly from the account.
 * This route only needs to serve the `image` field — everything else is
 * optional. Keeping the route path and params short (`/api/m?i=<url>`)
 * is critical because the full URI must fit in the 200-char Metaplex
 * metadata URI field.
 */
export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("i") ?? "";

  return NextResponse.json(
    { image: imageUrl },
    {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
