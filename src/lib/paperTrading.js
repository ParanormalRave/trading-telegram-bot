import {db} from "./postgres.js"

export async function getPaperBalance(telegramUserId){
    const result = await db.query('SELECT sol_balance FROM paper_balance WHERE telegram_user_id = $1', [telegramUserId])
    if (result?.rows?.length === 0){
        await db.query('INSERT INTO paper_balances (telegram_user_id, sol_balance) VALUES ($1, 10)', [telegramUserId])
        return 10
    }

    return Number(result?.rows[0]?.sol_balance || null)
}

export async function paperBuy(telegramUserId, tokenAddress, symbol, solAmount, tokenPriceUsd, solPriceUsd){
    const balance = await getPaperBalance(telegramUserId)
    if(solAmount > balance){
        throw new Error (`Insufficient paper balance. You have ${balance} SOL`)
    }
    const usdSpent = solAmount*solPriceUsd
    const tokensReceived = usdSpent/tokenPriceUsd


    await db.query('UPDATE paper_balances SET sol_balance = sol_balance - $1 WHERE telegram_user_id = $2',[solAmount, telegramUserId])
    await db.query('INSERT INTO paper_positions (telegram_user_id, token_address, symbol, amount_tokens, entry_price, sol_spent) VALUES ($1, $2, $3, $4, $5, $6)',
    [telegramUserId, tokenAddress, symbol, tokensReceived, tokenPriceUsd, solAmount],
)

    return {tokensReceived, newBalance: balance - solAmount}
}


export async function getPaperPositions(telegramUserId){
    const result = await db.query('SELECT * FROM paper_positions WHERE telegram_user_id = $1', [telegramUserId])
    return result?.rows || null
}

export async function paperSell(telegramUserId, positionId, currentPriceUsd, solPriceUsd) {
    const result = await db.query('SELECT * FROM paper_positions WHERE id = $1 AND telegram_user_id = $2', [positionId, telegramUserId])
    const position = result?.rows[0] || null

    if(!position) throw new Error("position not found");

    const currentValueUsd = Number(position.amount_tokens) * currentPriceUsd
    const solReceived = currentValueUsd / solPriceUsd
    const pnlUsd = currentValueUsd - Number(position.sol_spent) * solPriceUsd


    await db.query('UPDATE paper_balances SET sol_balance = sol_balance + $1 WHERE telegram_user_id = $2', [solReceived + telegramUserId])
    await db.query('DELETE FROM paper_positions WHERE id = $1', [positionId])

    return {solReceived, pnlUsd}
}




