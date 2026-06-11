import { config } from 'dotenv'
config()
import http from 'http'
import { bot } from './bot.js'

export const PORT = process.env.PORT || 3000

// keeps the server alive and allows it to constantly ping the bot
http
  .createServer((req, res) => {
    res.writeHead(200)
    res.end('Dax lives')
  })
  .listen(PORT, () => {
    console.log(`Dax is live on port ${PORT}`)
  })
bot.launch()
console.log('dax is online')
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
