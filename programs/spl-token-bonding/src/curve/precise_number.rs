//! Fixed-point arithmetic on top of `U192`.
//!
//! All values are stored scaled by `PRECISION = 10^12`. So the natural number
//! `1` is `1_000_000_000_000` internally. Operations are checked and return
//! `Option<Self>` (or `Result<Self>`) so that overflow / divide-by-zero
//! cannot silently corrupt curve math.
//!
//! `checked_pow_frac(p, q)` computes `self^(p/q)` as `(self^p)^(1/q)`.
//! The n-th root uses Newton's method:
//!
//! ```text
//! x_{n+1} = ((q - 1) * x_n + S^p / x_n^(q-1)) / q
//! ```
//!
//! and converges in well under 50 iterations for any input we care about.

use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

// `construct_uint!` is invoked inside a private sub-module so it expands
// without `anchor_lang::prelude::*` in scope. The prelude re-exports
// `Result` as a 1-arg alias of `anchor_lang::Result`, which shadows the
// 2-arg `core::result::Result` that the macro relies on internally and
// triggers a cascade of E0107 / E0277 / E0308 errors at the macro
// expansion site.
mod u192 {
    uint::construct_uint! {
        pub struct U192(3);
    }
}
pub use u192::U192;

/// 12 fixed decimals.
pub const ONE_PREC: u128 = 1_000_000_000_000;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct PreciseNumber {
    pub value: U192,
}

impl PreciseNumber {
    pub const PRECISION: u128 = ONE_PREC;
    pub const MAX_NEWTON_ITERS: u32 = 60;

    #[inline]
    pub fn one() -> Self {
        Self { value: U192::from(ONE_PREC) }
    }

    #[inline]
    pub fn zero() -> Self {
        Self { value: U192::zero() }
    }

    /// Promote a raw `u64` to a precise number (scales by `PRECISION`).
    pub fn from_u64(val: u64) -> Self {
        Self { value: U192::from(val) * U192::from(ONE_PREC) }
    }

    /// Promote a raw `u128` to a precise number (scales by `PRECISION`).
    pub fn from_u128(val: u128) -> Self {
        Self { value: U192::from(val) * U192::from(ONE_PREC) }
    }

    /// Wrap a value that is **already** scaled (i.e. raw fixed-point).
    pub fn from_raw(value: U192) -> Self {
        Self { value }
    }

    /// Truncate to a `u64` integer (i.e. divide by precision and downcast).
    pub fn to_u64(&self) -> Result<u64> {
        let scaled = self.value / U192::from(ONE_PREC);
        if scaled > U192::from(u64::MAX) {
            return err!(ErrorCode::U64ConversionFailed);
        }
        Ok(scaled.as_u64())
    }

    /// Round-half-up conversion to a `u64`.
    pub fn to_u64_round(&self) -> Result<u64> {
        let half = U192::from(ONE_PREC / 2);
        let rounded = (self.value + half) / U192::from(ONE_PREC);
        if rounded > U192::from(u64::MAX) {
            return err!(ErrorCode::U64ConversionFailed);
        }
        Ok(rounded.as_u64())
    }

    pub fn checked_add(&self, other: &Self) -> Option<Self> {
        self.value.checked_add(other.value).map(|value| Self { value })
    }

    pub fn checked_sub(&self, other: &Self) -> Option<Self> {
        self.value.checked_sub(other.value).map(|value| Self { value })
    }

    pub fn checked_mul(&self, other: &Self) -> Option<Self> {
        // (a * 1e12) * (b * 1e12) / 1e12 == (a * b) * 1e12
        let prod = self.value.checked_mul(other.value)?;
        let value = prod.checked_div(U192::from(ONE_PREC))?;
        Some(Self { value })
    }

    pub fn checked_div(&self, other: &Self) -> Option<Self> {
        if other.value.is_zero() {
            return None;
        }
        // (a * 1e12) / (b * 1e12) * 1e12 == (a / b) * 1e12
        let num = self.value.checked_mul(U192::from(ONE_PREC))?;
        let value = num.checked_div(other.value)?;
        Some(Self { value })
    }

    /// Integer power: `self^exp`. Linear in `exp`, but `exp` is bounded
    /// to `u8` so this is cheap.
    pub fn checked_int_pow(&self, exp: u8) -> Option<Self> {
        if exp == 0 {
            return Some(Self::one());
        }
        let mut acc = *self;
        for _ in 1..exp {
            acc = acc.checked_mul(self)?;
        }
        Some(acc)
    }

    /// `self^(1/n)` via Newton's method.
    pub fn checked_nth_root(&self, n: u8) -> Option<Self> {
        if n == 0 {
            return None;
        }
        if n == 1 {
            return Some(*self);
        }
        if self.value.is_zero() {
            return Some(Self::zero());
        }

        // Initial guess: self / n. Cheap and good enough for fast convergence
        // for the small `n` (<=10) we ever pass here.
        let n_prec = Self::from_u64(n as u64);
        let mut x = self.checked_div(&n_prec)?;
        if x.value.is_zero() {
            x = Self::one();
        }
        let n_minus_1 = Self::from_u64((n - 1) as u64);

        let mut last = x;
        for _ in 0..Self::MAX_NEWTON_ITERS {
            // x_{n+1} = ((n-1)*x + S / x^(n-1)) / n
            let pow = x.checked_int_pow(n - 1)?;
            let div = self.checked_div(&pow)?;
            let weighted = n_minus_1.checked_mul(&x)?;
            let sum = weighted.checked_add(&div)?;
            let next = sum.checked_div(&n_prec)?;

            // Convergence check: stop when delta is below 1 ulp.
            let delta = if next.value > last.value {
                next.value - last.value
            } else {
                last.value - next.value
            };
            x = next;
            if delta <= U192::from(1u64) {
                return Some(x);
            }
            last = x;
        }
        // Did not converge within budget — caller will surface as error.
        None
    }

    /// `self^(p/q)` computed as `(self^p)^(1/q)`.
    pub fn checked_pow_frac(&self, p: u8, q: u8) -> Option<Self> {
        if q == 0 {
            return None;
        }
        let powed = self.checked_int_pow(p)?;
        powed.checked_nth_root(q)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn approx_eq(a: &PreciseNumber, b: &PreciseNumber, tol: u128) -> bool {
        let diff = if a.value > b.value { a.value - b.value } else { b.value - a.value };
        diff <= U192::from(tol)
    }

    #[test]
    fn add_sub_mul_div_basics() {
        let two = PreciseNumber::from_u64(2);
        let three = PreciseNumber::from_u64(3);
        assert_eq!(two.checked_add(&three).unwrap(), PreciseNumber::from_u64(5));
        assert_eq!(three.checked_sub(&two).unwrap(), PreciseNumber::from_u64(1));
        assert_eq!(two.checked_mul(&three).unwrap(), PreciseNumber::from_u64(6));
        assert_eq!(
            PreciseNumber::from_u64(6).checked_div(&two).unwrap(),
            PreciseNumber::from_u64(3)
        );
    }

    #[test]
    fn nth_root_recovers_perfect_square() {
        let nine = PreciseNumber::from_u64(9);
        let r = nine.checked_nth_root(2).unwrap();
        // sqrt(9) == 3 (within 1 ulp)
        assert!(approx_eq(&r, &PreciseNumber::from_u64(3), 10));
    }

    #[test]
    fn pow_frac_three_halves() {
        // 4^(3/2) = 8
        let four = PreciseNumber::from_u64(4);
        let r = four.checked_pow_frac(3, 2).unwrap();
        assert!(approx_eq(&r, &PreciseNumber::from_u64(8), 10));
    }
}
