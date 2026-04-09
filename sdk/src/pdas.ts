/**
 * PDA derivation helpers. Mirrors the seeds in `programs/spl-token-bonding/src/state.rs`.
 */
import { PublicKey } from "@solana/web3.js";

export const SEED = {
  STATE: Buffer.from("state"),
  TOKEN_BONDING: Buffer.from("token-bonding"),
  MINT_AUTHORITY: Buffer.from("mint-authority"),
  BASE_STORAGE: Buffer.from("base-storage"),
  STORAGE_AUTHORITY: Buffer.from("storage-authority"),
} as const;

export function programStatePda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEED.STATE], programId);
}

export function tokenBondingPda(
  programId: PublicKey,
  targetMint: PublicKey,
  index = 0,
): [PublicKey, number] {
  const indexBytes = Buffer.alloc(2);
  indexBytes.writeUInt16LE(index, 0);
  return PublicKey.findProgramAddressSync(
    [SEED.TOKEN_BONDING, targetMint.toBuffer(), indexBytes],
    programId,
  );
}

export function targetMintAuthorityPda(
  programId: PublicKey,
  tokenBonding: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED.MINT_AUTHORITY, tokenBonding.toBuffer()],
    programId,
  );
}

export function baseStoragePda(
  programId: PublicKey,
  tokenBonding: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED.BASE_STORAGE, tokenBonding.toBuffer()],
    programId,
  );
}

export function baseStorageAuthorityPda(
  programId: PublicKey,
  tokenBonding: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED.STORAGE_AUTHORITY, tokenBonding.toBuffer()],
    programId,
  );
}
