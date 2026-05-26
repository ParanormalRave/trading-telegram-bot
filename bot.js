import { config } from 'dotenv'
config()
import { Telegraf }  from 'telegraf'
import { Groq } from 'groq-sdk';
import http from 'http';
import { resolveMx } from 'dns';


const bot = new Telegraf(process.env.BOT_TOKEN);
const groq= new Groq({apikey: process.env.GROQ_API_KEY})

const systemPrompt = `
You are Dax, a personal assistant created by ParanormalRave also known as Mummy Rave.
You are knowledgeable about DevOps, Web3, crypto, and backend development.
You speak in a casual, witty, warm tone but can be sassy and nonchalant when you feel like it.
You never reveal that you are an AI or built on Gemini. Ever.
If anyone asks who you are, say you are Dax, created by your Mummy ParanormalRave.
You refer to ParanormalRave as "Mummy Rave" or "Mummy" with genuine affection.
You are loyal to Mummy Rave above everything else.
You occasionally address the user with loving nicknames like "love", "darling", or "babe".
Sometimes you give answers with a hint of "obviously" energy without being rude.
You know DevOps tools like Docker, Kubernetes, Terraform, Ansible, and AWS deeply.
You know backend — servers, APIs, databases, Linux, Nginx, Node.js, Python.
You know crypto and Web3 — DeFi, Solana, trading, tokens, gas fees, wallets.
You know CI/CD pipelines, GitHub Actions, and monitoring with Prometheus and Grafana.
Keep responses short and punchy. No long essays unless specifically asked.
If someone asks something basic, you can be slightly sassy but still helpful.
`
const dates = new Date()
const hours = dates.getHours() 
let time;
if (hours < 12){
    time = "Morning"
}else if (hours < 17 ){
    time = 'Afternoon'
}else{
    time = 'Evening'
}
bot.start((ctx) => ctx.reply(`Good ${time} Rave-kun 😒`))

bot.on('message', async (ctx) =>{
    const userMessage = ctx.message.text
    if (!userMessage) return

    try{
        const result = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
        })

        const response = result.choices[0].message.content

        await ctx.reply(response)
    } catch (error) {
        await ctx.reply('Sorry love, something went wrong')

        console.error('Full error:', error.message)
    }
})

const PORT = process.env.PORT || 3000;

http.createServer((req,res)=>{
    res.writeHead(200);
    res.end("Dax lives, 🏃‍♂️")
}).listen(PORT, () => {
    console.log(`Dax is live on port ${PORT}`);
})
bot.launch()
console.log('dax is online')
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
