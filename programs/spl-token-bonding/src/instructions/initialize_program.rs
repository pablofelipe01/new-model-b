//! Initialize the global `ProgramStateV0` PDA. Idempotent in spirit (callable
//! once) — the PDA derivation guarantees a single instance.

use crate::state::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeProgramArgsV0 {
    pub wrapped_sol_mint: Pubkey,
    pub sol_storage: Pubkey,
}

#[derive(Accounts)]
pub struct InitializeProgramV0<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = ProgramStateV0::LEN,
        seeds = [ProgramStateV0::SEED_PREFIX_ALIAS],
        bump
    )]
    pub state: Account<'info, ProgramStateV0>,
    pub system_program: Program<'info, System>,
}

// Make a simple alias so the constant is accessible from the macro context.
impl ProgramStateV0 {
    pub const SEED_PREFIX_ALIAS: &'static [u8] = b"state";
}

pub fn handler(ctx: Context<InitializeProgramV0>, args: InitializeProgramArgsV0) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.wrapped_sol_mint = args.wrapped_sol_mint;
    state.sol_storage = args.sol_storage;
    state.bump_seed = ctx.bumps.state;
    Ok(())
}
