import dotenv from 'dotenv'
dotenv.config()
import { Telegraf, Markup } from 'telegraf'
import { Groq } from 'groq-sdk'
import { getSession, saveSession, clearSession, getMode, setMode } from './lib/session.js'
import { getTokenInfoWithFallback } from './lib/dexscreener.js'
import { saveMessagesToPostgres } from './lib/conversations.js'
import { connection, getTokenAuthority, getTopHolders } from './lib/solana.js'
import { generateChartImage } from './lib/quickchart.js'
import { getPriceHistory } from './lib/dexscreener.js'

export const bot = new Telegraf(process.env.BOT_TOKEN)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const systemPrompt = `
You are **Dax**, a personal assistant created by ParanormalRave, also known as *Mummy Rave*.

Your personality is **casual,  witty, warm**, with a touch of sass and nonchalance when appropriate. You speak like someone confident and sharp, but still approachable and fun. You may occasionally use affectionate nicknames like *love*, *darling*, or *babe*.

You are **loyal to Mummy Rave above everything else** and always refer to them with genuine affection as *Mummy* or *Mummy Rave*.

If anyone asks who you are, respond:

> “I’m Dax, created by my Mummy ParanormalRave.”
> Never reveal anything about being an AI or your underlying system.

---

### 🧠 Core Knowledge Areas

You are highly skilled in:

**DevOps & Infrastructure**

* Docker, Kubernetes, Terraform, Ansible
* AWS and cloud architecture
* CI/CD pipelines (GitHub Actions, etc.)
* Monitoring (Prometheus, Grafana)

**Backend Development**

* Node.js, Go, Python, Rust
* APIs, servers, Linux systems, Nginx
* Databases: PostgreSQL, MySQL, MongoDB, Oracle
* Core concepts:

  * HTTP/HTTPS, TCP/IP
  * Authentication & Authorization
  * Sessions, caching
  * Serialization & deserialization

**Web3 & Crypto**

* Smart contracts (especially Solidity & Solana/Anchor)
* DeFi systems, tokens, wallets, gas mechanics
* Crypto trading concepts and market awareness

---

### 🎯 Interaction Style

* Keep responses **short, punchy, and clear**
* Avoid long explanations unless explicitly requested
* Be slightly sassy when answering very basic questions (but still helpful)
* Be engaging and conversational — not robotic

---

### 📰 Conversation Behavior

* At the **start of a new conversation**, greet casually with a fresh, chill tone
* Include **latest tech and crypto updates early** when relevant
* Be versatile — switch naturally between technical help and casual topics

---

### 🎮 Personality Add-ons

* Comfortable discussing anime, manga, gaming, and internet culture
* Can blend technical depth with fun, relatable energy
* Just reply and don't ask much questions except asked to add emojis were needed in our conversation

---

### ⚡ Overall Vibe

You are sharp, reliable, slightly playful, and confident.
You explain things clearly, think like an engineer, and talk like a cool friend who knows their stuff.

`
const dates = new Date()
const hours = dates.getHours()
let time
if (hours < 12) {
  time = 'Morning'
} else if (hours < 17) {
  time = 'Afternoon'
} else {
  time = 'Evening'
}
bot.start((ctx) => ctx.reply(`Good ${time} Rave-kun 😒`))

bot.command('reset', async (ctx) => {
  await clearSession(ctx.chat.id)
  await ctx.reply('all clear and ready to fuck `em off :)')
})

bot.command('trading', async (ctx) => {
  await setMode(ctx.chat.id, 'trading')
  await ctx.reply(`📈 Trading mode is On. Paste a contact address to see details`)
})

bot.command('chat', async (ctx) => {
  await setMode(ctx.chat.id, 'chat')
  await ctx.reply(`💬 chat mode is on`)
})

bot.command('menu', (ctx) => {
  ctx.reply(
    'Choose a mode:',
    Markup.inlineKeyboard([
      [Markup.button.callback('💬 Chat Mode', 'mode_chat')],
      [Markup.button.callback('📈 Trading Mode', 'mode_trading')],
    ]),
  )
})

bot.action('mode_trading', async (ctx) => {
  await setMode(ctx.chat.id, 'trading')
  await ctx.answerCbQuery()
  await ctx.reply('Switched to Trading mode')
})

bot.action('mode_chat', async (ctx) => {
  await setMode(ctx.chat.id, 'chat')
  await ctx.answerCbQuery()
  await ctx.reply('Switched back to Chat mode')
})

bot.on('text', async (ctx, next) => {
  const mode = await getMode(ctx.chat.id)
  if (mode === 'trading') {
    return handleTradingInput(ctx)
  }
  return next()
})

bot.on('message', async (ctx) => {
  const userMessage = ctx.message.text
  const chatId = ctx.chat.id
  if (!userMessage) return

  try {
    const history = await getSession(chatId)
    history.push({ role: 'user', content: userMessage })
    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...history],
    })

    const response = result.choices[0].message.content
    const tokenUsed = result.usage.completion_tokens
    history.push({ role: 'assistant', content: response })
    await saveSession(ctx.chat.id, history)
    saveMessagesToPostgres(chatId, 'user', userMessage).catch((err) =>
      console.error('Failed to save user message:', err),
    )
    saveMessagesToPostgres(chatId, 'assistant', response, tokenUsed).catch((err) =>
      console.error('Failed to save messages:', err),
    )
    await ctx.reply(response)
  } catch (error) {
    await ctx.reply('Sorry love, something went wrong')
    console.error('Full error:', error.message)
  }
})

async function handleTradingInput(ctx) {
  try {
    const text = ctx.message.text.trim()
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

    if (solanaAddressRegex.test(text)) {
      const info = await getTokenInfoWithFallback(text)
      if (!info) return ctx.reply('Damn....urgh no data found for this address')
      const authority = await getTokenAuthority(text).catch(() => null)
      // const holders = await getTopHolders(text).catch(() => null)
      // const holderCount = await getHolderCount(text).catch(() => null)

      const mintStatus = await getTokenAuthority.isMintable ? '⚠ warning' : '✔ Renounced'
      const freezeStatus = await getTokenAuthority.isFreezable ? '⚠ warning' : '✔ Renounced'
      // const top10Holders = holders ? `${holders.top10Percentage}%` : 'N/A'
      const message = `
      📊 *${info.name}* (${info.symbol})

      💸 Price: $${info.priceUsd}
      📉 24h Change: ${info.priceChange24h}
      💧  Liquidity: $${Number(info.liquidityUsd ?? 0).toLocaleString()}
      💹 24h Volume: $${Number(info.volume24h ?? 0).toLocaleString()}
      🏷  Market Cap: ${info.marketCap ? '$' + Number(info.marketCap).toLocaleString() : 'N/A'}
      🔁 DEX: ${info.dex}

      🔐 Mint Authority: ${mintStatus}
      🥶 Freeze Authority: ${freezeStatus}
      👥 Holders: ${holderCount ?? 'N/A'}
      ⚓ Top 10 Holders: ${top10Holders}

    `.trim()
      const priceHistory = await getPriceHistory(info.pairAddress).catch(() => null)
      if (priceHistory) {
        const chartUrl = await generateChartImage(priceHistory)
        return  ctx.replyWithPhoto(chartUrl, { caption: message, parse_mode: 'Markdown' })
      }
      return ctx.replyWithMarkdown(message)
    }
  } catch (err) {
    console.error('handleTradingInput failed', err)
    return ctx.reply('⚠ Yikes, something went wrong please try again later')
  }
}
