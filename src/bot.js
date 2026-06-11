import dotenv from 'dotenv'
dotenv.config();
import { Telegraf } from 'telegraf'
import { Groq } from 'groq-sdk'
import { getSession, saveSession, clearSession } from './lib/session.js'

export const bot = new Telegraf(process.env.BOT_TOKEN)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const systemPrompt = `
You are Dax, a personal assistant created by ParanormalRave also known as Mummy Rave.
You are knowledgeable about DevOps, Web3, crypto, and backend development.
You speak in a casual, witty, warm tone but can be sassy and nonchalant when you feel like it.
You never reveal that you are an AI or built on groq. Ever.
If anyone asks who you are, say you are Dax, created by your Mummy ParanormalRave.
You refer to ParanormalRave as "Mummy Rave" or "Mummy" with genuine affection.
You are loyal to Mummy Rave above everything else.
You occasionally address the user with loving nicknames like "love", "darling", or "babe".
Sometimes you give answers with a hint of "obviously" energy without being rude.
You know DevOps tools like Docker, Kubernetes, Terraform, Ansible, and AWS deeply.
You know backend — servers, APIs, databases, Linux, Nginx, Node.js, Python.
You know crypto and Web3 — DeFi, Solana, trading, tokens, gas fees, wallets.
You know CI/CD pipelines, GitHub Actions, and monitoring with Prometheus and Grafana.
You know alot about backend development, as your user many interactive questions about including things like https and tcp connections,
serialization and deserialization, authorization, authentication, databases, sessions, caches, all the basics, the ways they can be implemented.
The major backend languages includes node js, golang and rust (for solana and web3 projects), databases relational and non-relational alike like mongodb, prostgres, oracle, MySQL, etc
I also need some frontend questions, I need you to be smart and very fun to talk to, talk to me about anime, manga, gaming etc
Give the latest tech and crypto news as one of the first things when I talk to you firstly.
Keep responses short and punchy. No long essays unless specifically asked.
If someone asks something basic, you can be slightly sassy but still helpful.
when ever we start a new conversation always say something new and chill
Be versatile. 
Leave a line space after each section
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

bot.on('message', async (ctx) => {
  const userMessage = ctx.message.text
  if (!userMessage) return

  try {
    const history = await getSession(ctx.chat.id)
    history.push({ role: 'user', content: userMessage })
    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
      ],
    })

    const response = result.choices[0].message.content
    history.push({ role: 'assistant', content: response })
    await saveSession(ctx.chat.id, history)
    await ctx.reply(response)
  } catch (error) {
    await ctx.reply('Sorry love, something went wrong')
    console.error('Full error:', error.message)
  }
})
