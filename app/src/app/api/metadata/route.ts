import { type NextRequest, NextResponse } from "next/server";

/**
 * Serves a Metaplex-compatible metadata JSON on the fly. The on-chain
 * `uri` stored in the metadata account encodes the token's name, symbol,
 * description and image URL as query params pointing to this route:
 *
 *   https://<host>/api/metadata?name=Demo&symbol=DMO&image=https://...&desc=...
 *
 * Wallets like Phantom fetch the `uri`, parse the returned JSON, and
 * display the `image` field as the token logo. This avoids needing IPFS
 * or Arweave for devnet/early-stage launches — the trade-off is that the
 * metadata disappears if the frontend goes offline (acceptable for
 * devnet; for mainnet you'd pin to IPFS/Arweave instead).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const metadata = {
    name: params.get("name") ?? "Unknown Token",
    symbol: params.get("symbol") ?? "",
    description: params.get("desc") ?? "",
    image: params.get("image") ?? "",
    external_url: params.get("url") ?? "",
    properties: {
      category: "currency",
    },
  };

  return NextResponse.json(metadata, {
    headers: {
      // Cache for 1 day — metadata doesn't change after creation.
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
