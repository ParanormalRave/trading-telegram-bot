import { VersionedTransaction } from '@solana/web3.js'
import { connection } from './solana'
import { quote } from 'telegraf/format'

export async function getSwapedQuote(inputMint, outputMint, amount) {
  const url = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`,
  )
  const data = url.json()
  return data
}

export async function executeSwap(quoteResponse, useKeyPair) {
  const swapRes = await fetch(`https://quote-api.jup.ag/v6/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: useKeyPair.publickey.toString(),
      wrapAndUnwrapSol: true,
    }),
  })

  const { swapTransaction } = await swapRes.json()
  const txBuf = Buffer.from(swapTransaction, 'base64')

  const transaction = VersionedTransaction.deserialize(txBuf)
  transaction.sign([useKeyPair])

  const txid = await connection.sendTransaction(transaction)
  await connection.confirmTransaction(txid, 'confirmed')

  return txid
}
