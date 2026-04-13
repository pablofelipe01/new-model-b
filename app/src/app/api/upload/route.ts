import { type NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy to Pinata's pinFileToIPFS endpoint. The Pinata JWT
 * lives in the `PINATA_JWT` env var (server-only, never exposed to the
 * browser) so users can upload images without creating their own Pinata
 * account.
 *
 * Accepts: multipart/form-data with a single `file` field.
 * Returns: { url: "https://<gateway>/ipfs/<cid>" }
 */
export async function POST(request: NextRequest) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "PINATA_JWT not configured on the server" },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Forward to Pinata
  const pinataForm = new FormData();
  pinataForm.append("file", file);
  pinataForm.append(
    "pinataMetadata",
    JSON.stringify({ name: file.name }),
  );

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: pinataForm,
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Pinata upload failed: ${text}` },
      { status: res.status },
    );
  }

  const { IpfsHash } = await res.json();

  // Use Pinata's dedicated gateway if the user has one, otherwise the
  // public IPFS gateway. The env var is optional.
  const gateway =
    process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud";
  const url = `${gateway}/ipfs/${IpfsHash}`;

  return NextResponse.json({ url });
}
