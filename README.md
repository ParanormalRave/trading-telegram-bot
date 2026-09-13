# Dax 🤖

A Telegram bot that blends a witty AI companion with real-time Solana token
lookups and paper trading — built to feel like chatting with a sharp, slightly
sassy friend who also happens to know the markets.

## What Dax does

- **Conversational AI** — powered by Groq (`openai/gpt-oss-120b`), Dax chats
  naturally, remembers context per-session, and has a distinct personality
  (casual, witty, loyal to its creator).
- **Token lookups** — paste any Solana contract address in trading mode and
  get an instant visual card: price, 24h change, liquidity, volume, market
  cap, mint/freeze authority status, top-10 holder concentration, and token
  age.
- **Paper trading** — a full simulated trading flow: buy with preset or
  custom SOL amounts, track open positions, refresh live P&L, and sell in
  25/50/75/100% increments — all without touching real funds.
- **Live charts** — candlestick price charts across 5M/15M/1H/4H/1D
  timeframes, rendered on demand.
- **Wallet generation** — creates and encrypts a real Solana wallet per user,
  ready for future real-money execution.
- **Status monitoring** — a separate scheduled job reports uptime, CPU, and
  memory usage to a Discord channel, so health can be checked from a phone
  without opening a dashboard.

## Tech stack

| Layer | Tools |
|---|---|
| Bot framework | [Telegraf](https://telegraf.js.org/) (Telegram Bot API) |
| Language model | Groq API |
| Chain data | DexScreener API, GeckoTerminal API |
| Charts & cards | QuickChart, `node-canvas`, `sharp` |
| Database | PostgreSQL (Supabase) |
| Solana | `@solana/web3.js` |
| Hosting | Fly.io |
| Monitoring | Fly Prometheus/Grafana + a custom GitHub Actions → Discord webhook job |

## Project structure

```
daxthebot/
├── src/
│   ├── bot.js                 # Main Telegraf handlers, commands, actions
│   └── lib/
│       ├── dexscreener.js     # Token data fetching + fallback chain
│       ├── quickchart.js      # Candlestick chart generation
│       ├── cards.js           # Token intro / PnL card image generation
│       ├── solana.js          # On-chain reads (authority, holders)
│       ├── wallet.js          # Wallet keypair generation + encryption
│       ├── walletDb.js        # Wallet persistence
│       ├── paperTrading.js    # Paper balance, buy/sell, positions
│       ├── session.js         # Per-chat mode/state (Redis-backed)
│       └── conversations.js   # Chat history persistence
├── monitoring/
│   └── status-check.js        # Fly status/metrics → Discord webhook
├── .github/workflows/
│   └── status-check.yml       # Scheduled + manual monitoring trigger
├── Dockerfile
└── package.json
```

## Setup

### Prerequisites
- Node.js 22+
- A Telegram bot token (via [@BotFather](https://t.me/BotFather))
- A Groq API key
- A PostgreSQL database (Supabase or otherwise)
- Redis instance (for session state)

### Environment variables

```
BOT_TOKEN=            # Telegram bot token
GROQ_API_KEY=          # Groq API key
OwnerId=               # Your Telegram user ID (restricts bot access)
ENCRYPTION_KEY=        # Key for encrypting generated wallet secrets
DATABASE_URL=          # Postgres connection string
REDIS_URL=             # Redis connection string
```

### Install & run

```bash
npm install
npm run start
```

### Deploy (Fly.io)

```bash
fly deploy
```

The Dockerfile handles both build-time native dependencies (for `canvas`,
via cairo/pango/etc.) and the matching runtime shared libraries in the final
image — both stages need their own copies since Docker's multi-stage builds
don't carry system packages forward automatically.

## Commands

| Command | Description |
|---|---|
| `/start` | Greet the user |
| `/trading` | Switch to trading mode (paste a CA to look up a token) |
| `/chat` | Switch to conversational chat mode |
| `/wallet` | View or generate a Solana wallet |
| `/balance` | Check paper trading balance |
| `/positions` | List open paper positions |
| `/sell <id>` | Sell a position by ID (25/50/75/100%) |
| `/menu` | Show mode-switch buttons |
| `/reset` | Clear conversation session |

## Monitoring

A standalone script in `monitoring/status-check.js` runs on a schedule via
GitHub Actions, queries Fly's Machines API (uptime/state) and Prometheus
endpoint (CPU/memory), and posts a formatted summary to a Discord webhook —
giving an at-a-glance health check from anywhere, no dashboard login
required.

## Roadmap

- [ ] Pin paper positions to the exact pool bought into (fixing PnL drift
      across multiple pools for the same token)
- [ ] EVM chain support (wallet generation, price data, swap execution)
- [ ] Real-money execution as a separate code path from paper trading
- [ ] PNL result cards (happy/sad meme backgrounds based on outcome)

## License

*(add your preferred license here)*
