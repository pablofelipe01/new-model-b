//! Update mutable fields on a `TokenBondingV0`. Only callable by the current
//! `general_authority`.
//!
//! NOTE — what this CANNOT change, by design:
//!   * `master_wallet` and `platform_fee_basis_points` (frozen at init).
//!   * `launcher_fee_wallet` and `launcher_fee_basis_points` (frozen at init —
//!     a launcher cannot retroactively raise the fee on existing holders).
//!   * Anything that would let funds leave `base_storage` outside of `sell_v1`.

use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateTokenBondingArgsV0 {
    pub general_authority: Option<Pubkey>,
    pub curve_authority: Option<Pubkey>,
    pub buy_frozen: Option<bool>,
    pub sell_frozen: Option<bool>,
}

#[derive(Accounts)]
pub struct UpdateTokenBondingV0<'info> {
    pub general_authority: Signer<'info>,
    #[account(mut)]
    pub token_bonding: Account<'info, TokenBondingV0>,
}

// `general_authority` is `Option<Pubkey>` so we cannot use `has_one` —
// the comparison is done manually inside the handler.
pub fn handler(
    ctx: Context<UpdateTokenBondingV0>,
    args: UpdateTokenBondingArgsV0,
) -> Result<()> {
    let bonding = &mut ctx.accounts.token_bonding;

    let signer = ctx.accounts.general_authority.key();
    match bonding.general_authority {
        Some(auth) if auth == signer => {}
        _ => return err!(ErrorCode::MissingAuthority),
    }

    if let Some(v) = args.general_authority {
        bonding.general_authority = Some(v);
    }
    if let Some(v) = args.curve_authority {
        bonding.curve_authority = Some(v);
    }
    if let Some(v) = args.buy_frozen {
        bonding.buy_frozen = v;
    }
    if let Some(v) = args.sell_frozen {
        bonding.sell_frozen = v;
    }

    Ok(())
}
