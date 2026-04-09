use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
    #[msg("Division by zero")]
    DivisionByZero,
    #[msg("Conversion to u64 overflowed")]
    U64ConversionFailed,
    #[msg("Newton's method failed to converge")]
    NewtonDidNotConverge,
    #[msg("Invalid curve parameters")]
    InvalidCurve,
    #[msg("Buys are frozen on this token bonding")]
    BuyFrozen,
    #[msg("Sells are frozen on this token bonding")]
    SellFrozen,
    #[msg("Bonding is not yet live")]
    NotLiveYet,
    #[msg("Buy window has closed")]
    BuyWindowClosed,
    #[msg("Slippage exceeded — price moved beyond max_price / below min_price")]
    SlippageExceeded,
    #[msg("Mint cap exceeded")]
    MintCapExceeded,
    #[msg("Purchase cap exceeded")]
    PurchaseCapExceeded,
    #[msg("Royalty percentage exceeds 100%")]
    InvalidRoyalty,
    #[msg("Provided account does not match expected PDA / mint")]
    InvalidAccount,
    #[msg("Missing required authority signature")]
    MissingAuthority,
    #[msg("Both desired_target_amount and base_amount are set, exactly one is required")]
    AmbiguousBuyArgs,
    #[msg("Neither desired_target_amount nor base_amount were set")]
    MissingBuyArgs,
    #[msg("Curve definition is empty")]
    EmptyCurve,
    #[msg("Reserve would become insolvent")]
    InsolventReserve,
}
