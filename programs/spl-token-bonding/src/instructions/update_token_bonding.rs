//! Update authorities, royalty destinations, freeze flags. Only callable by
//! the current `general_authority`.

use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateTokenBondingArgsV0 {
    pub general_authority: Option<Pubkey>,
    pub reserve_authority: Option<Pubkey>,
    pub curve_authority: Option<Pubkey>,
    pub buy_base_royalty_percentage: Option<u32>,
    pub buy_target_royalty_percentage: Option<u32>,
    pub sell_base_royalty_percentage: Option<u32>,
    pub sell_target_royalty_percentage: Option<u32>,
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
    if let Some(v) = args.reserve_authority {
        bonding.reserve_authority = Some(v);
    }
    if let Some(v) = args.curve_authority {
        bonding.curve_authority = Some(v);
    }

    let bps_max = 10_000u32;
    if let Some(v) = args.buy_base_royalty_percentage {
        if v > bps_max {
            return err!(ErrorCode::InvalidRoyalty);
        }
        bonding.buy_base_royalty_percentage = v;
    }
    if let Some(v) = args.buy_target_royalty_percentage {
        if v > bps_max {
            return err!(ErrorCode::InvalidRoyalty);
        }
        bonding.buy_target_royalty_percentage = v;
    }
    if let Some(v) = args.sell_base_royalty_percentage {
        if v > bps_max {
            return err!(ErrorCode::InvalidRoyalty);
        }
        bonding.sell_base_royalty_percentage = v;
    }
    if let Some(v) = args.sell_target_royalty_percentage {
        if v > bps_max {
            return err!(ErrorCode::InvalidRoyalty);
        }
        bonding.sell_target_royalty_percentage = v;
    }
    if let Some(v) = args.buy_frozen {
        bonding.buy_frozen = v;
    }
    if let Some(v) = args.sell_frozen {
        bonding.sell_frozen = v;
    }

    Ok(())
}
