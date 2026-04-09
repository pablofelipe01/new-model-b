//! Create a reusable `CurveV0` definition account.

use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCurveArgsV0 {
    pub definition: PiecewiseCurve,
}

#[derive(Accounts)]
#[instruction(args: CreateCurveArgsV0)]
pub struct CreateCurveV0<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = CurveV0::LEN,
    )]
    pub curve: Account<'info, CurveV0>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateCurveV0>, args: CreateCurveArgsV0) -> Result<()> {
    // Reject empty / malformed definitions early. The instruction is rare,
    // so the validation is cheap and saves debugging on the SDK side.
    match &args.definition {
        PiecewiseCurve::TimeV0 { curves } => {
            if curves.is_empty() {
                return err!(ErrorCode::EmptyCurve);
            }
            if curves.len() > CurveV0::MAX_CURVE_PIECES {
                return err!(ErrorCode::InvalidCurve);
            }
            for piece in curves {
                if let PrimitiveCurve::ExponentialCurveV0 { frac, pow, .. } = &piece.curve {
                    if *frac == 0 || *pow > 10 || *frac > 10 {
                        return err!(ErrorCode::InvalidCurve);
                    }
                }
            }
        }
    }

    ctx.accounts.curve.definition = args.definition;
    Ok(())
}
