# Social Platform Research — Creator Token Model

## Purpose of this document

We are building a **creator tokenization platform** on Solana where fans can buy tokens that represent real, quantifiable support for their favorite content creators. The token price follows a bonding curve: the more fans buy, the higher the price — creating a provably fair, anti-fraud model of fandom.

The key differentiator: **zero crypto knowledge required**. Fans sign up with a social login, buy tokens with a credit card, and see their "investment" in their creator grow. No wallets, no seed phrases, no swaps.

To make this work, we need to **integrate deeply with at least one social platform** for both creator identity verification ("claiming" a token) and fan discovery (finding creators to support). This document evaluates the major platforms to determine which one(s) to prioritize.

---

## What we need from a social platform

### 1. Creator identity verification (OAuth / API)

The creator must prove they own their social account so we can link it to a bonding curve token. This requires:

- **OAuth login**: creator signs in with their social account
- **Profile data access**: we need at minimum the username, display name, profile picture, follower count, and account verification status
- **Account age / legitimacy signals**: to prevent someone from creating a fake account and claiming a token

| Requirement | Why it matters |
|---|---|
| OAuth 2.0 support | Standard auth flow, well-documented |
| Profile picture access | Used as the token logo (stored via Metaplex metadata) |
| Follower count | Displayed on the creator's token page as social proof |
| Verified badge / blue check | Helps distinguish real creators from impersonators |
| Bio / description | Used as token description |
| Content category / niche | Helps with discovery and categorization |

### 2. Fan discovery and sharing

Fans need to find their creators on our platform. This can happen:

- **Organically**: creator shares a link to their token page on their social feed ("Buy my token!")
- **Via our platform**: we show a directory of creators that fans can browse
- **Embeddable widgets**: creator embeds a "Buy my token" button on their profile or website

| Requirement | Why it matters |
|---|---|
| Link sharing in posts/bio | Creator can share their token page URL |
| Embeddable content (cards, buttons) | Rich previews when sharing links |
| API for follower/engagement data | Power rankings, trending creators |
| Direct messaging (optional) | Token holders could get access to DMs or exclusive content |

### 3. Viral mechanics

The platform should have built-in mechanics that help the model spread:

- Can creators post about their token to their followers?
- Do links get rich previews (Open Graph tags)?
- Is there a culture of "supporting creators" on the platform?
- Are there existing monetization tools we complement (not compete with)?

### 4. Regulatory / policy considerations

- Does the platform's Terms of Service allow promoting financial products?
- Are there restrictions on crypto-related content?
- Has the platform banned or restricted crypto projects before?
- What are the rules around OAuth app approval?

---

## Platform-by-platform analysis

### Instagram

**Audience**: 2B+ monthly active users. Skews visual: photos, Reels, Stories.

**Creator ecosystem**: Massive. Influencers, artists, photographers, fitness, lifestyle, food. Instagram IS the influencer economy.

**OAuth / API**:
- Instagram Basic Display API was **deprecated in December 2024**
- Replaced by **Instagram Graph API** (requires Facebook Business account)
- OAuth via Facebook Login → permissions for `instagram_basic`, `instagram_manage_insights`
- Available data: username, bio, profile picture, follower count, media
- **Limitation**: requires a Facebook Page linked to the Instagram account (friction for creators)
- **Limitation**: API approval process can take weeks and requires business verification

**Link sharing**:
- Links in posts: ❌ (not clickable in captions)
- Link in bio: ✅ (standard, via Linktree-style tools)
- Link in Stories: ✅ (swipe up / link sticker, requires 10K+ followers)
- Open Graph previews: ❌ (Instagram doesn't render OG cards in-app)

**Viral mechanics**:
- Strong culture of "support this creator"
- Reels have massive organic reach
- BUT Instagram actively suppresses posts with external links

**Crypto policy**:
- Meta has historically been restrictive on crypto ads
- Organic crypto content is allowed but can get shadow-banned
- No explicit ban on tokenization projects

**Verdict**: Huge audience, perfect creator ecosystem, but **API access is painful** (Facebook Business requirement) and **link sharing is limited** (no clickable links in posts).

---

### X (Twitter)

**Audience**: 600M+ monthly active users. Text-first, real-time conversation.

**Creator ecosystem**: Strong in tech, crypto, politics, media, comedy. Many creators have large followings. "Crypto Twitter" (CT) is one of the most active communities.

**OAuth / API**:
- **OAuth 2.0 with PKCE**: well-documented, standard flow
- Scopes: `tweet.read`, `users.read`, `follows.read`
- Available data: username, display name, bio, profile image, follower count, verified status, account creation date
- **Free tier** (Basic): 1 app, read-only, limited to tweet posting
- **Pro tier** ($5,000/month): full API access, higher rate limits
- **Limitation**: API pricing is extremely high for production use
- **Alternative**: Basic tier might be enough for just OAuth + profile read

**Link sharing**:
- Links in tweets: ✅ (clickable, with preview card)
- Link in bio: ✅
- Open Graph cards: ✅ (renders image + title + description from your meta tags)
- Twitter Cards: ✅ (rich embeds for your URLs)

**Viral mechanics**:
- Retweets / quote tweets = native virality
- "Crypto Twitter" culture already understands tokens
- Threads can explain the model in detail
- Community Notes could flag misleading claims (good for trust)

**Crypto policy**:
- X is **crypto-friendly** under current ownership
- No restrictions on crypto content
- Many crypto projects use X as primary marketing channel
- Grok AI integration could surface tokenized creators

**Verdict**: **Best API for identity verification**, great link sharing with rich cards, crypto-native audience. BUT the broader consumer audience (non-crypto fans) is smaller than Instagram/TikTok.

---

### TikTok

**Audience**: 1.5B+ monthly active users. Video-first, Gen Z/Millennial.

**Creator ecosystem**: Explosive. Music, dance, comedy, education, lifestyle. Creators can go from 0 to millions overnight.

**OAuth / API**:
- **TikTok Login Kit**: OAuth 2.0, returns user profile (display name, avatar, open_id)
- **TikTok API for Developers**: access to video data, user info
- Available data: display name, avatar URL, follower count (via API v2)
- **Limitation**: video-focused API — less profile metadata than X
- **Limitation**: API approval requires app review (~1-2 weeks)
- **Limitation**: geographic restrictions (banned in some countries, uncertain US status)

**Link sharing**:
- Links in videos: ❌ (not clickable in captions)
- Link in bio: ✅ (requires 1K+ followers)
- Open Graph previews: ❌ (TikTok doesn't render OG cards)
- TikTok Shop integration: possible but complex

**Viral mechanics**:
- Algorithm-driven discovery (For You Page) = massive organic reach
- Duets / Stitches = built-in collaboration/sharing
- BUT content is video-only — hard to explain financial products in 60 seconds
- Trend-driven culture — tokens could become a trend, or get ignored

**Crypto policy**:
- TikTok has **banned crypto advertising** in many regions
- Organic crypto content exists but is often flagged or suppressed
- Regulatory uncertainty (especially in the US)

**Verdict**: Biggest viral potential and youngest audience, but **crypto-hostile policies**, limited link sharing, and API is video-centric. High risk of platform policy changes.

---

### YouTube

**Audience**: 2.5B+ monthly active users. Video-first, long and short form.

**Creator ecosystem**: The OG creator platform. Music, education, gaming, vlogs, podcasts. Creators have deep, loyal audiences.

**OAuth / API**:
- **Google OAuth 2.0**: the gold standard. Well-documented, fast approval
- **YouTube Data API v3**: channels, playlists, videos, subscribers
- Available data: channel name, description, profile picture, subscriber count, video count, country
- **Free tier**: 10,000 units/day (enough for auth + profile reads)
- **Limitation**: subscriber count is public but some creators hide it

**Link sharing**:
- Links in video descriptions: ✅ (clickable)
- Links in Community tab: ✅ (clickable)
- Channel banner / About section: ✅
- End screens / cards: ✅ (link to external URL)
- Open Graph previews: N/A (YouTube is the destination, not the referrer)

**Viral mechanics**:
- Shorts have TikTok-like discovery potential
- Community tab for text/image posts
- Super Chat / Super Thanks = existing "support creator" culture
- BUT YouTube's algorithm favors watch time, not external links

**Crypto policy**:
- Google Ads restricts crypto advertising
- Organic crypto content is **allowed and thriving** (crypto YouTubers are massive)
- No restrictions on linking to crypto projects
- YouTube has explored Web3 features (NFT integration was announced then shelved)

**Verdict**: Best OAuth flow (Google), massive creator ecosystem, existing "pay to support" culture (Super Chat). BUT video-centric and less "real-time" than X.

---

### Farcaster (Web3 native)

**Audience**: ~500K users. Crypto-native, decentralized social network on Ethereum/Base.

**Creator ecosystem**: Small but highly engaged. Many crypto builders, investors, artists. Growing via Frames (interactive embeds).

**OAuth / API**:
- **Sign In With Farcaster (SIWF)**: native Web3 auth
- Available data: FID (Farcaster ID), username, bio, pfp, follower count, connected wallets
- **Free, open, permissionless**: no API approval needed
- **Connected wallets**: users already have Ethereum/Base wallets linked

**Link sharing**:
- Frames: ✅ (interactive mini-apps embedded in posts — could embed a "Buy token" button directly)
- Links in casts: ✅ (clickable, with OG previews)

**Viral mechanics**:
- Frames = the killer feature. Users can buy a token without leaving their Farcaster feed
- Channels = topic-based communities
- Small but very engaged audience
- Direct integration with crypto wallets

**Crypto policy**:
- **Built for crypto**. No restrictions whatsoever.
- Users already understand tokens, wallets, DeFi

**Verdict**: **Perfect product-market fit** for a tokenization product. Tiny audience, but 100% of them understand and want what we're building. Best for MVP/early adopter validation. BUT too small for a consumer product targeting non-crypto fans.

---

## Comparison matrix

| Factor | Instagram | X (Twitter) | TikTok | YouTube | Farcaster |
|---|---|---|---|---|---|
| **Audience size** | ★★★★★ | ★★★★ | ★★★★★ | ★★★★★ | ★ |
| **Creator ecosystem** | ★★★★★ | ★★★★ | ★★★★★ | ★★★★★ | ★★ |
| **OAuth ease** | ★★ | ★★★★ | ★★★ | ★★★★★ | ★★★★★ |
| **Profile data richness** | ★★★ | ★★★★★ | ★★★ | ★★★★ | ★★★★ |
| **Link sharing** | ★★ | ★★★★★ | ★★ | ★★★★ | ★★★★★ |
| **Rich previews (OG)** | ★ | ★★★★★ | ★ | ★★ | ★★★★ |
| **Crypto friendliness** | ★★ | ★★★★★ | ★ | ★★★ | ★★★★★ |
| **Viral mechanics** | ★★★★ | ★★★★ | ★★★★★ | ★★★ | ★★★ |
| **API cost** | Free | Free–$5K/mo | Free | Free | Free |
| **Regulatory risk** | ★★★ | ★★★★★ | ★★ | ★★★★ | ★★★★★ |
| **Non-crypto user base** | ★★★★★ | ★★★ | ★★★★★ | ★★★★★ | ★ |

(★ = worst, ★★★★★ = best for our use case)

---

## Strategic options

### Option 1: Start with X → expand to Instagram

**Rationale**: X has the best combination of OAuth, link sharing, crypto friendliness, and rich preview cards. "Crypto Twitter" provides early adopters who validate the model. Then expand to Instagram to reach mainstream audiences.

**Pros**: Fastest to market, lowest API friction, built-in crypto community
**Cons**: X's broader audience is smaller and skews older/male. Instagram reach is much bigger for lifestyle/entertainment creators.

### Option 2: Start with YouTube → expand to Instagram

**Rationale**: YouTube has the best OAuth (Google), existing "support creator" culture (Super Chat), and massive reach. Creators already monetize directly from fans.

**Pros**: Huge creator base, established monetization norms, Google OAuth is bulletproof
**Cons**: Video-centric platform — our product is about tokens, not video. Less "real-time" engagement.

### Option 3: Start with Farcaster → expand to X → then Instagram

**Rationale**: Farcaster users are the perfect early adopters — they already have wallets, understand tokens, and Frames let us embed "Buy token" directly in the feed. Validate the model with 500K crypto-native users, then expand to X (crypto-friendly mainstream), then Instagram (full mainstream).

**Pros**: Fastest product-market fit, cheapest to build (no on-ramp needed for Farcaster users), Frames are magical for UX
**Cons**: Tiny audience. Not a consumer product until you expand.

### Option 4: Platform-agnostic (email + any social)

**Rationale**: Don't pick one platform. Let creators claim their token by verifying any social account (X, Instagram, YouTube, TikTok). Fans discover creators through our own explore page, not through the social platform.

**Pros**: No platform dependency, broadest creator pool
**Cons**: No viral loop through any specific platform, harder to bootstrap discovery, need to build OAuth for all platforms

---

## Recommendation framework

Answer these questions to determine the right starting platform:

### Who is the first creator?

If you have specific creators in mind who would launch first, go where they are:
- Musicians / visual artists → **Instagram**
- Tech / crypto / politics → **X**
- Gamers / educators / vloggers → **YouTube**
- Gen Z / dance / comedy → **TikTok**
- Crypto builders / web3 → **Farcaster**

### Who is the first fan?

If the first fans are:
- Already in crypto → **Farcaster** or **X** (no on-ramp needed)
- Non-crypto, credit-card buyers → **Instagram** or **YouTube** (need full on-ramp)

### What's the MVP timeline?

- **2 weeks**: Farcaster (no on-ramp, crypto-native users, Frames)
- **1 month**: X (OAuth + MoonPay + Privy)
- **2 months**: Instagram or YouTube (more complex OAuth + full on-ramp + mobile UX)

### What's the geographic focus?

- **US/Europe**: MoonPay, Stripe, all platforms work
- **Latin America**: Transak or Mercuryo for on-ramp, Instagram is dominant, TikTok is risky (regulation)
- **Global**: X + YouTube have the most uniform global access

---

## Questions to answer before deciding

1. Do you have specific creators who would be first adopters? What platform are they biggest on?
2. Is the initial audience crypto-savvy or completely non-crypto?
3. What's the launch geography? (affects on-ramp/off-ramp provider choice)
4. How important is virality vs. controlled growth?
5. Is this a B2C play (fans find creators on our app) or B2B2C (creators bring their own fans via their social channels)?
6. What's the acceptable timeline for MVP with real users?
7. Are there legal/regulatory constraints in your target market around tokenized social engagement?

---

## Appendix: Technical integration complexity

| Platform | OAuth setup time | API data quality | Maintenance burden |
|---|---|---|---|
| **X** | 1-2 days | Excellent (username, pfp, followers, verified, bio) | Low (stable API, standard OAuth) |
| **YouTube** | 1 day | Excellent (Google OAuth, channel data) | Very low (Google APIs are rock solid) |
| **Instagram** | 3-5 days | Good (requires Facebook Business setup) | Medium (Meta changes APIs frequently) |
| **TikTok** | 2-3 days | Moderate (less profile metadata) | Medium (API evolving, regulatory risk) |
| **Farcaster** | 0.5 days | Good (FID, pfp, followers, connected wallets) | Very low (open protocol, no approval needed) |
