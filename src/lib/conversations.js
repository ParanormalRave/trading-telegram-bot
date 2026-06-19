import { db } from './postgres.js'
export async function saveMessagesToPostgres(chatId, role, content, tokenUsed = null) {
  try {
    const result = await db.query(
      'INSERT INTO dax_conversations (chat_id, role, content, token_used) VALUES ($1, $2, $3, $4) RETURNING id',
      [chatId, role, content, tokenUsed],
    )

    console.log(`[postgres] Saved message for chat ${chatId}`)
    return result.rows[0].id
  } catch (error) {
    console.error(`[Postgres Error] Failed to save message:`, error.message)
    return null
  }
}

export async function getRecentMessages(chatId, limit = 20) {
  try {
    const result = await db.query(
      'SELECT role, content FROM dax_conversations WHERE chat_id = $1 ORDER BY created_at DESC LIMIT $2',
      [chatId,limit]
    )

    const messages = result.rows.reverse().map(row =>({
      role : row.role,
      content: row.content
    }))

    console.log(`[Postgres] Loaded ${messages.length} recent messages for chat ${chatId}`)
    return messages;
  } catch (error) {
    console.error("Failed to load messages", error.message);
    return [];
  }
}
