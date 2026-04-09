//! Exponential bonding curve math.
//!
//! Spot price:
//!     P(S) = c * S^(pow/frac) + b
//!
//! Reserve (integral of price from 0 to S):
//!     R(S) = c * S^(k+1) / (k + 1) + b * S
//!     where k = pow/frac, so k + 1 = (pow + frac) / frac
//!
//! Buying `amount` tokens when current supply is `S0`:
//!     cost = R(S0 + amount) - R(S0)
//!
//! Buying `base` worth from supply `S0` (inverse): solve `R(S0 + x) = R(S0) + base`
//! for `x`. We use bisection because the curve is monotonically increasing
//! and bisection is robust against the corners (`pow = 0`, `c = 0`, etc).
//!
//! `c` and `b` are stored with `PRECISION = 10^12` fixed decimals (the same
//! convention used by `PreciseNumber`). Supplies and amounts are raw `u64`s
//! (smallest token unit, like lamports for SPL).

use crate::curve::precise_number::{PreciseNumber, ONE_PREC};
use crate::errors::ErrorCode;
use crate::state::ExponentialCurveV0;
use anchor_lang::prelude::*;

/// Promote a raw fixed-point parameter (`c`, `b`) — already scaled by
/// `PRECISION` — to a `PreciseNumber`.
fn raw_to_prec(raw: u128) -> PreciseNumber {
    PreciseNumber::from_raw(crate::curve::precise_number::U192::from(raw))
}

/// Spot price `P(S)` returned in base-token smallest units (`u64`).
pub fn current_price(curve: &ExponentialCurveV0, supply: u64) -> Result<u64> {
    if curve.frac == 0 {
        return err!(ErrorCode::InvalidCurve);
    }
    let s = PreciseNumber::from_u64(supply);
    let s_pow = s
        .checked_pow_frac(curve.pow, curve.frac)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;
    let c = raw_to_prec(curve.c);
    let b = raw_to_prec(curve.b);
    let term = c.checked_mul(&s_pow).ok_or(error!(ErrorCode::ArithmeticOverflow))?;
    let price = term.checked_add(&b).ok_or(error!(ErrorCode::ArithmeticOverflow))?;
    price.to_u64()
}

/// `R(S)` — total base reserve required to back supply `S` from zero.
pub fn reserve_for_supply(curve: &ExponentialCurveV0, supply: u64) -> Result<u128> {
    if curve.frac == 0 {
        return err!(ErrorCode::InvalidCurve);
    }
    if supply == 0 {
        return Ok(0);
    }

    let s = PreciseNumber::from_u64(supply);

    // k + 1 = (pow + frac) / frac
    let new_pow = (curve.pow as u16) + (curve.frac as u16);
    if new_pow > u8::MAX as u16 {
        return err!(ErrorCode::ArithmeticOverflow);
    }
    let new_pow = new_pow as u8;

    let s_pow = s
        .checked_pow_frac(new_pow, curve.frac)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;

    // c * S^(k+1) / (k+1) — but (k+1) is a rational frac/(pow+frac)... wait,
    // k+1 = (pow+frac)/frac, so 1/(k+1) = frac/(pow+frac).
    // So term1 = c * S^(k+1) * frac / (pow + frac)
    let c = raw_to_prec(curve.c);
    let mut term1 = c
        .checked_mul(&s_pow)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;
    let frac_num = PreciseNumber::from_u64(curve.frac as u64);
    let denom = PreciseNumber::from_u64((curve.pow as u64) + (curve.frac as u64));
    term1 = term1
        .checked_mul(&frac_num)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;
    term1 = term1.checked_div(&denom).ok_or(error!(ErrorCode::DivisionByZero))?;

    // b * S
    let b = raw_to_prec(curve.b);
    let term2 = b.checked_mul(&s).ok_or(error!(ErrorCode::ArithmeticOverflow))?;

    let total = term1
        .checked_add(&term2)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;

    // Return as u128 (raw / PRECISION). Reserves can exceed u64 in theory.
    let raw_div = total.value / crate::curve::precise_number::U192::from(ONE_PREC);
    Ok(raw_div.as_u128())
}

/// Cost of buying `target_amount` tokens starting from `current_supply`.
pub fn price_for_tokens(
    curve: &ExponentialCurveV0,
    current_supply: u64,
    target_amount: u64,
) -> Result<u64> {
    let r0 = reserve_for_supply(curve, current_supply)?;
    let r1 = reserve_for_supply(
        curve,
        current_supply
            .checked_add(target_amount)
            .ok_or(error!(ErrorCode::ArithmeticOverflow))?,
    )?;
    let diff = r1
        .checked_sub(r0)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;
    if diff > u64::MAX as u128 {
        return err!(ErrorCode::U64ConversionFailed);
    }
    Ok(diff as u64)
}

/// Tokens you receive when spending `base_amount` from `current_supply`.
///
/// Solves `R(current_supply + x) - R(current_supply) == base_amount` for `x`
/// using bisection. The curve is monotonic so bisection always converges.
pub fn tokens_for_price(
    curve: &ExponentialCurveV0,
    current_supply: u64,
    base_amount: u64,
) -> Result<u64> {
    if base_amount == 0 {
        return Ok(0);
    }
    let r0 = reserve_for_supply(curve, current_supply)?;
    let target_reserve = (r0 as u128)
        .checked_add(base_amount as u128)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;

    // Bracket: low = 0, high = grows by doubling until R(supply+high) >= target.
    let mut low: u64 = 0;
    let mut high: u64 = 1;
    loop {
        let try_supply = current_supply
            .checked_add(high)
            .ok_or(error!(ErrorCode::ArithmeticOverflow))?;
        let r = reserve_for_supply(curve, try_supply)?;
        if r >= target_reserve {
            break;
        }
        if high > u64::MAX / 2 {
            return err!(ErrorCode::ArithmeticOverflow);
        }
        high = high.saturating_mul(2);
    }

    // Standard bisection: ~64 iterations max for u64.
    for _ in 0..70 {
        if high - low <= 1 {
            break;
        }
        let mid = low + (high - low) / 2;
        let r = reserve_for_supply(
            curve,
            current_supply
                .checked_add(mid)
                .ok_or(error!(ErrorCode::ArithmeticOverflow))?,
        )?;
        if r > target_reserve {
            high = mid;
        } else {
            low = mid;
        }
    }

    // Always round down so the user can never receive more than they paid for.
    Ok(low)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn linear_curve() -> ExponentialCurveV0 {
        // P(S) = 1 * S^(1/1) = S, R(S) = S^2 / 2
        ExponentialCurveV0 { c: ONE_PREC, b: 0, pow: 1, frac: 1 }
    }

    #[test]
    fn linear_reserve_matches_closed_form() {
        let curve = linear_curve();
        // R(10) should be ~50
        let r = reserve_for_supply(&curve, 10).unwrap();
        assert!(r >= 49 && r <= 51, "expected ~50 got {r}");
    }

    #[test]
    fn buying_from_zero_costs_integral() {
        let curve = linear_curve();
        let cost = price_for_tokens(&curve, 0, 10).unwrap();
        assert!(cost >= 49 && cost <= 51);
    }

    #[test]
    fn tokens_for_price_inverts_price_for_tokens() {
        let curve = linear_curve();
        let cost = price_for_tokens(&curve, 100, 50).unwrap();
        let recovered = tokens_for_price(&curve, 100, cost).unwrap();
        // bisection rounds down so allow ±1
        assert!(recovered >= 49 && recovered <= 50, "got {recovered}");
    }
}
