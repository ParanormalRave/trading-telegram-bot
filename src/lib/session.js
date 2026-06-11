//redis connection
import { redis } from './redis.js'
const TTL = 3600 //store an hour worth of time
// used to get the session id of each chat and return the data in an array form if it exists
export async function getSession(chatId) {
  try{
    const data = await redis.get(`session:${chatId}`)
    return data ? JSON.parse(data) : []
  }catch(error){
    console.error(`Error message for parsing session ${chatId}`,error.messages )
    return [];
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
