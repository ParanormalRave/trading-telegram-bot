import dotenv from 'dotenv'
dotenv.config()
import { Redis } from '@upstash/redis'
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

redis.set('test', 'connected').then(() => console.log('redis connected successfully')).catch((err)=>console.error("Redis failed because",err.message))
