/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/spl_token_bonding.json`.
 */
export type SplTokenBonding = {
  "address": "41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa",
  "metadata": {
    "name": "splTokenBonding",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Configurable bonding curve protocol for Solana SPL tokens"
  },
  "instructions": [
    {
      "name": "buyV1",
      "docs": [
        "Buy tokens along the curve. Either fix `desired_target_amount` and",
        "compute the base cost, or fix `base_amount` and compute the tokens out."
      ],
      "discriminator": [
        69,
        255,
        7,
        52,
        119,
        228,
        164,
        6
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenBonding",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  45,
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "targetMint"
              },
              {
                "kind": "account",
                "path": "token_bonding.index",
                "account": "tokenBondingV0"
              }
            ]
          }
        },
        {
          "name": "curve"
        },
        {
          "name": "baseMint",
          "writable": true
        },
        {
          "name": "targetMint",
          "writable": true
        },
        {
          "name": "targetMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tokenBonding"
              }
            ]
          }
        },
        {
          "name": "baseStorage",
          "writable": true
        },
        {
          "name": "buyBaseRoyalties",
          "writable": true
        },
        {
          "name": "buyTargetRoyalties",
          "writable": true
        },
        {
          "name": "source",
          "docs": [
            "Source of base tokens spent by the buyer."
          ],
          "writable": true
        },
        {
          "name": "destination",
          "docs": [
            "Destination of newly minted target tokens."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "buyV1Args"
            }
          }
        }
      ]
    },
    {
      "name": "createCurveV0",
      "docs": [
        "Create a reusable curve definition account."
      ],
      "discriminator": [
        205,
        203,
        250,
        201,
        156,
        135,
        114,
        221
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "curve",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createCurveArgsV0"
            }
          }
        }
      ]
    },
    {
      "name": "initializeProgramV0",
      "docs": [
        "Initialize the global program state. Idempotent: callable once."
      ],
      "discriminator": [
        204,
        24,
        212,
        47,
        180,
        190,
        173,
        190
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initializeProgramArgsV0"
            }
          }
        }
      ]
    },
    {
      "name": "initializeTokenBondingV0",
      "docs": [
        "Initialize a token bonding tied to a (base_mint, target_mint, curve).",
        "If `target_mint` is freshly created, the bonding's PDA mint authority",
        "becomes its mint authority."
      ],
      "discriminator": [
        4,
        205,
        255,
        32,
        185,
        121,
        134,
        61
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "baseMint"
        },
        {
          "name": "targetMint"
        },
        {
          "name": "curve"
        },
        {
          "name": "tokenBonding",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  45,
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "targetMint"
              },
              {
                "kind": "arg",
                "path": "args.index"
              }
            ]
          }
        },
        {
          "name": "targetMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tokenBonding"
              }
            ]
          }
        },
        {
          "name": "baseStorage",
          "docs": [
            "Reserve token account, owned by the storage authority PDA."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  101,
                  45,
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tokenBonding"
              }
            ]
          }
        },
        {
          "name": "baseStorageAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tokenBonding"
              }
            ]
          }
        },
        {
          "name": "buyBaseRoyalties",
          "docs": [
            "Royalty destinations. Stored as `UncheckedAccount` rather than",
            "`Account<TokenAccount>` to keep the `try_accounts` stack frame",
            "under the 4 KB BPF limit — full deserialization of 4 token",
            "accounts pushes the frame over budget. The buy/sell instructions",
            "re-validate these as `TokenAccount`s when actually used, so the",
            "looser typing here is safe."
          ]
        },
        {
          "name": "buyTargetRoyalties"
        },
        {
          "name": "sellBaseRoyalties"
        },
        {
          "name": "sellTargetRoyalties"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initializeTokenBondingArgsV0"
            }
          }
        }
      ]
    },
    {
      "name": "sellV1",
      "docs": [
        "Sell tokens back along the curve."
      ],
      "discriminator": [
        19,
        129,
        236,
        31,
        99,
        212,
        19,
        208
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenBonding",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  45,
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "targetMint"
              },
              {
                "kind": "account",
                "path": "token_bonding.index",
                "account": "tokenBondingV0"
              }
            ]
          }
        },
        {
          "name": "curve"
        },
        {
          "name": "baseMint",
          "writable": true
        },
        {
          "name": "targetMint",
          "writable": true
        },
        {
          "name": "baseStorage",
          "writable": true
        },
        {
          "name": "baseStorageAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tokenBonding"
              }
            ]
          }
        },
        {
          "name": "sellBaseRoyalties",
          "writable": true
        },
        {
          "name": "sellTargetRoyalties",
          "writable": true
        },
        {
          "name": "source",
          "docs": [
            "Source of target tokens being sold (seller's ATA)."
          ],
          "writable": true
        },
        {
          "name": "destination",
          "docs": [
            "Destination of base tokens (seller's base ATA)."
          ],
          "writable": true
        },
        {
          "name": "targetMintAuthority",
          "docs": [
            "Mint authority PDA — needed to mint the target-side royalty."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tokenBonding"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "sellV1Args"
            }
          }
        }
      ]
    },
    {
      "name": "transferReservesV0",
      "docs": [
        "Move base reserves out of `base_storage`. Only the reserve authority",
        "can call this. Useful for migrations."
      ],
      "discriminator": [
        7,
        142,
        255,
        166,
        164,
        247,
        159,
        157
      ],
      "accounts": [
        {
          "name": "reserveAuthority",
          "signer": true
        },
        {
          "name": "tokenBonding",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  45,
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "token_bonding.target_mint",
                "account": "tokenBondingV0"
              },
              {
                "kind": "account",
                "path": "token_bonding.index",
                "account": "tokenBondingV0"
              }
            ]
          }
        },
        {
          "name": "baseStorage",
          "writable": true
        },
        {
          "name": "baseStorageAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tokenBonding"
              }
            ]
          }
        },
        {
          "name": "destination",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "transferReservesArgsV0"
            }
          }
        }
      ]
    },
    {
      "name": "updateTokenBondingV0",
      "docs": [
        "Update authorities, royalty destinations, freeze flags."
      ],
      "discriminator": [
        10,
        181,
        83,
        74,
        124,
        211,
        123,
        48
      ],
      "accounts": [
        {
          "name": "generalAuthority",
          "signer": true
        },
        {
          "name": "tokenBonding",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateTokenBondingArgsV0"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "curveV0",
      "discriminator": [
        77,
        25,
        232,
        252,
        138,
        96,
        1,
        172
      ]
    },
    {
      "name": "programStateV0",
      "discriminator": [
        102,
        65,
        191,
        196,
        12,
        36,
        248,
        123
      ]
    },
    {
      "name": "tokenBondingV0",
      "discriminator": [
        83,
        36,
        213,
        250,
        189,
        200,
        154,
        127
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6001,
      "name": "arithmeticUnderflow",
      "msg": "Arithmetic underflow"
    },
    {
      "code": 6002,
      "name": "divisionByZero",
      "msg": "Division by zero"
    },
    {
      "code": 6003,
      "name": "u64ConversionFailed",
      "msg": "Conversion to u64 overflowed"
    },
    {
      "code": 6004,
      "name": "newtonDidNotConverge",
      "msg": "Newton's method failed to converge"
    },
    {
      "code": 6005,
      "name": "invalidCurve",
      "msg": "Invalid curve parameters"
    },
    {
      "code": 6006,
      "name": "buyFrozen",
      "msg": "Buys are frozen on this token bonding"
    },
    {
      "code": 6007,
      "name": "sellFrozen",
      "msg": "Sells are frozen on this token bonding"
    },
    {
      "code": 6008,
      "name": "notLiveYet",
      "msg": "Bonding is not yet live"
    },
    {
      "code": 6009,
      "name": "buyWindowClosed",
      "msg": "Buy window has closed"
    },
    {
      "code": 6010,
      "name": "slippageExceeded",
      "msg": "Slippage exceeded — price moved beyond max_price / below min_price"
    },
    {
      "code": 6011,
      "name": "mintCapExceeded",
      "msg": "Mint cap exceeded"
    },
    {
      "code": 6012,
      "name": "purchaseCapExceeded",
      "msg": "Purchase cap exceeded"
    },
    {
      "code": 6013,
      "name": "invalidRoyalty",
      "msg": "Royalty percentage exceeds 100%"
    },
    {
      "code": 6014,
      "name": "invalidAccount",
      "msg": "Provided account does not match expected PDA / mint"
    },
    {
      "code": 6015,
      "name": "missingAuthority",
      "msg": "Missing required authority signature"
    },
    {
      "code": 6016,
      "name": "ambiguousBuyArgs",
      "msg": "Both desired_target_amount and base_amount are set, exactly one is required"
    },
    {
      "code": 6017,
      "name": "missingBuyArgs",
      "msg": "Neither desired_target_amount nor base_amount were set"
    },
    {
      "code": 6018,
      "name": "emptyCurve",
      "msg": "Curve definition is empty"
    },
    {
      "code": 6019,
      "name": "insolventReserve",
      "msg": "Reserve would become insolvent"
    }
  ],
  "types": [
    {
      "name": "buyV1Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "desiredTargetAmount",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "baseAmount",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "slippageMaxBase",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "slippageMinTarget",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "createCurveArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "definition",
            "type": {
              "defined": {
                "name": "piecewiseCurve"
              }
            }
          }
        ]
      }
    },
    {
      "name": "curveV0",
      "docs": [
        "A reusable curve definition. Token bondings reference a curve account",
        "rather than embedding the math, so the same curve can power many bondings."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "definition",
            "type": {
              "defined": {
                "name": "piecewiseCurve"
              }
            }
          }
        ]
      }
    },
    {
      "name": "initializeProgramArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wrappedSolMint",
            "type": "pubkey"
          },
          {
            "name": "solStorage",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "initializeTokenBondingArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u16"
          },
          {
            "name": "goLiveUnixTime",
            "type": "i64"
          },
          {
            "name": "freezeBuyUnixTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "buyBaseRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "buyTargetRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "sellBaseRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "sellTargetRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "mintCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "purchaseCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "generalAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "reserveAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "curveAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "buyFrozen",
            "type": "bool"
          },
          {
            "name": "ignoreExternalReserveChanges",
            "type": "bool"
          },
          {
            "name": "ignoreExternalSupplyChanges",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "piecewiseCurve",
      "docs": [
        "Outer wrapper enum so we can later add `LinearV0`, `LogarithmicV0`, etc."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "timeV0",
            "fields": [
              {
                "name": "curves",
                "type": {
                  "vec": {
                    "defined": {
                      "name": "timeCurveV0"
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "primitiveCurve",
      "docs": [
        "We avoid tuple variants on enums that cross the IDL boundary because",
        "Anchor 0.30+ encodes tuple variant fields as positional `_0` keys in",
        "the TS coder, which is easy to mis-serialize from the client. Inlining",
        "the named fields makes the wire format unambiguous on both sides."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "exponentialCurveV0",
            "fields": [
              {
                "name": "c",
                "type": "u128"
              },
              {
                "name": "b",
                "type": "u128"
              },
              {
                "name": "pow",
                "type": "u8"
              },
              {
                "name": "frac",
                "type": "u8"
              }
            ]
          },
          {
            "name": "constantPriceCurveV0",
            "fields": [
              {
                "name": "price",
                "type": "u64"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "programStateV0",
      "docs": [
        "Global program state. There is exactly one of these, derived at PDA",
        "`[\"state\"]`. Holds canonical references for the wrapped SOL mint and",
        "the program's SOL storage."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wrappedSolMint",
            "type": "pubkey"
          },
          {
            "name": "solStorage",
            "type": "pubkey"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sellV1Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "targetAmount",
            "type": "u64"
          },
          {
            "name": "slippageMinBase",
            "docs": [
              "Minimum base tokens the seller is willing to receive (slippage floor)."
            ],
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "timeCurveV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "offset",
            "type": "u64"
          },
          {
            "name": "curve",
            "type": {
              "defined": {
                "name": "primitiveCurve"
              }
            }
          },
          {
            "name": "buyTransitionFees",
            "type": {
              "option": {
                "defined": {
                  "name": "transitionFeeV0"
                }
              }
            }
          },
          {
            "name": "sellTransitionFees",
            "type": {
              "option": {
                "defined": {
                  "name": "transitionFeeV0"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "tokenBondingV0",
      "docs": [
        "One bonding curve instance. The `(target_mint, index)` pair is unique."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baseMint",
            "type": "pubkey"
          },
          {
            "name": "targetMint",
            "type": "pubkey"
          },
          {
            "name": "generalAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "reserveAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "curveAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "baseStorage",
            "docs": [
              "Token account holding the base reserves."
            ],
            "type": "pubkey"
          },
          {
            "name": "buyBaseRoyalties",
            "type": "pubkey"
          },
          {
            "name": "buyTargetRoyalties",
            "type": "pubkey"
          },
          {
            "name": "sellBaseRoyalties",
            "type": "pubkey"
          },
          {
            "name": "sellTargetRoyalties",
            "type": "pubkey"
          },
          {
            "name": "buyBaseRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "buyTargetRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "sellBaseRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "sellTargetRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "curve",
            "type": "pubkey"
          },
          {
            "name": "mintCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "purchaseCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "goLiveUnixTime",
            "type": "i64"
          },
          {
            "name": "freezeBuyUnixTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "createdAtUnixTime",
            "type": "i64"
          },
          {
            "name": "buyFrozen",
            "type": "bool"
          },
          {
            "name": "sellFrozen",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u16"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "baseStorageBumpSeed",
            "type": "u8"
          },
          {
            "name": "targetMintAuthorityBumpSeed",
            "type": "u8"
          },
          {
            "name": "reserveAuthorityBumpSeed",
            "type": "u8"
          },
          {
            "name": "reserveBalanceFromBonding",
            "docs": [
              "Virtual reserve / supply tracked by the program. Used when the",
              "real mint can be inflated externally and we still want a stable",
              "curve domain."
            ],
            "type": "u64"
          },
          {
            "name": "supplyFromBonding",
            "type": "u64"
          },
          {
            "name": "ignoreExternalReserveChanges",
            "type": "bool"
          },
          {
            "name": "ignoreExternalSupplyChanges",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "transferReservesArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "transitionFeeV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "percentage",
            "docs": [
              "Fee in basis points. 100 == 1.00%."
            ],
            "type": "u32"
          },
          {
            "name": "interval",
            "docs": [
              "Time in seconds over which the fee linearly decays to zero."
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "updateTokenBondingArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "generalAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "reserveAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "curveAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "buyBaseRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "buyTargetRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "sellBaseRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "sellTargetRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "buyFrozen",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "sellFrozen",
            "type": {
              "option": "bool"
            }
          }
        ]
      }
    }
  ]
};
