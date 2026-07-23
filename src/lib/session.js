//redis connection
import { message } from 'telegraf/filters'
import { redis } from './redis.js'
const TTL = 86400 //store an days worth of time 
// used to get the session id of each chat and return the data in an array form if it exists
export async function getSession(chatId) {
  try {
    const data = await redis.get(`session:${chatId}`)
    console.log('Raw data from Redis:', data, 'Type:', typeof data)
    if (typeof data === 'object' && data !== null) {
      return data
    }
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Error message for parsing session ${chatId}`, error)
    return []
  }
}

//use the acquired chat id to save the stringified message and then destruct after an hour of inactivity
export async function saveSession(chatId, messages) {
  await redis.set(`session:${chatId}`, JSON.stringify(messages), { ex: TTL })
}

//erases the stored data
export async function clearSession(chatId) {
  await redis.del(`session:${chatId}`)
}

// gets the chat mode this makes the mode change to chat by default
export async function getMode(chatId){
  const mode = await redis.get(`mode:${chatId}`)
  return mode || `chat`
}

export async function setPendingChart(chatId, poolAddress){
  await redis.set(`chart: ${chatId}`, poolAddress, {ex: TTL})
}

export async function getPendingChart(chatId){
  await redis.get(`chart: ${chatId}`)
}

export async function setMode(chatId, mode){
  await redis.set(`mode:${chatId}`, mode)
}

