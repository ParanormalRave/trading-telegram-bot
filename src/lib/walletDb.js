import { db } from "./postgres"
export async function saveWallet(telegramUserId, publicKey, encryptedSecret, iv, authTag){
    await db.query(
        'INSERT INTO wallets (telegram_user_id, public_key, encrypted_secret, iv, auth_tag) VALUES ($1, $2, $3, $4, $5) ',
        [telegramUserId, publicKey, encryptedSecret, iv, authTag]
    )
}


export async function getWallet(telegramUserId){
    const result = await db.query('SELECT * FROM wallets WHERE telegram_user_id = $1', [telegramUserId])
    return result.rows[0] || null
}
