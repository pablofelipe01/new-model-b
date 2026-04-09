//! Move base reserves out of `base_storage`. Requires `reserve_authority`.
//!
//! This is intentionally minimal — useful for migrations or for graduating
//! a bonding to a real AMM pool. The general authority cannot call it; only
//! the (separate) reserve authority can.

use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransferReservesArgsV0 {
    pub amount: u64,
}

#[derive(Accounts)]
pub struct TransferReservesV0<'info> {
    pub reserve_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            TokenBondingV0::SEED_PREFIX,
            token_bonding.target_mint.as_ref(),
            &token_bonding.index.to_le_bytes(),
        ],
        bump = token_bonding.bump_seed,
    )]
    pub token_bonding: Account<'info, TokenBondingV0>,

    #[account(mut, address = token_bonding.base_storage @ ErrorCode::InvalidAccount)]
    pub base_storage: Account<'info, TokenAccount>,

    /// CHECK: PDA, validated by seeds.
    #[account(
        seeds = [TokenBondingV0::STORAGE_AUTHORITY_SEED, token_bonding.key().as_ref()],
        bump = token_bonding.reserve_authority_bump_seed,
    )]
    pub base_storage_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<TransferReservesV0>, args: TransferReservesArgsV0) -> Result<()> {
    let bonding = &ctx.accounts.token_bonding;
    let signer = ctx.accounts.reserve_authority.key();
    match bonding.reserve_authority {
        Some(auth) if auth == signer => {}
        _ => return err!(ErrorCode::MissingAuthority),
    }

    if args.amount > ctx.accounts.base_storage.amount {
        return err!(ErrorCode::InsolventReserve);
    }

    let bonding_key = ctx.accounts.token_bonding.key();
    let bump = ctx.accounts.token_bonding.reserve_authority_bump_seed;
    let signer_seeds: &[&[&[u8]]] = &[&[
        TokenBondingV0::STORAGE_AUTHORITY_SEED,
        bonding_key.as_ref(),
        &[bump],
    ]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.base_storage.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.base_storage_authority.to_account_info(),
            },
            signer_seeds,
        ),
        args.amount,
    )?;

    let bonding = &mut ctx.accounts.token_bonding;
    bonding.reserve_balance_from_bonding = bonding
        .reserve_balance_from_bonding
        .saturating_sub(args.amount);

    Ok(())
}
