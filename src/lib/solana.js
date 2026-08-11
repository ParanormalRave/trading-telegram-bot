import { Connection } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'
import { getMint } from '@solana/spl-token'

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
export const connection = new Connection(RPC_URL, 'confirmed')

export async function getBalance(walletAddress) {
  const publicKey = new PublicKey(walletAddress)
  const lamports = await connection.getBalance(publicKey)
  return lamports / 1e9
}

// mint and freeze check
export async function getTokenAuthority(tokenAddress) {
  const mintPubkey = new PublicKey(tokenAddress)
  const mintInfo = await getMint(connection, mintPubkey)
  return {
    mintAuthority: mintInfo.mintAuthority ? mintInfo.mintAuthority.toString() : null,
    isMintable: mintInfo.mintAuthority !== null,
    freezeAuthority: mintInfo.freezeAuthority ? mintInfo.freezeAuthority.toString() : null,
    isFreezable: mintInfo.freezeAuthority !== null,
    currentSupply: mintInfo.supply.toString(),
    decimals: mintInfo.decimals
  }
}   

const KNOWN_BURN_ADDRESSES = [
  '1nc1nerator11111111111111111111111111111111',
  '11111111111111111111111111111111',
]

export async function checkLiquidityBurnStatus(lpMintAddress) {
  const lpMintPublicKey = new PublicKey(lpMintAddress)

  const supply = await connection.getTokenSupply(lpMintPublicKey)
  const totalLpSupply = Number(supply.value.amount)

  const largestAccount = await connection.getTokenLargestAccounts(lpMintPublicKey)
  let burnedAmount = 0
  let burnedPercentage = 0 // FIX: declared outside the loop so it survives past it

  for (const account of largestAccount.value) {
    const accountInfo = await connection.getParsedAccountInfo(account.address)
    const owner = accountInfo.value?.data?.parsed?.info?.owner

    if (KNOWN_BURN_ADDRESSES.includes(owner)) {
      burnedAmount += Number(account.amount)
    }
  }

  // FIX: percentage calculated once after the loop, using the final burnedAmount
  burnedPercentage = (burnedAmount / totalLpSupply) * 100

  return {
    totalLpSupply,
    burnedAmount,
    burnedPercentage: burnedPercentage.toFixed(2),
    isEffective: burnedPercentage > 95,
  }
}

export async function getTopHolders(tokenAddress) {
  const mintAddress = new PublicKey(tokenAddress)
  const largestAccounts = await connection.getTokenLargestAccounts(mintAddress)

  const top10 = largestAccounts.value.slice(0, 10)
  const totalSupply = await connection.getTokenSupply(mintAddress)

  const top10WithOwners = await Promise.all(
    top10.map(async (acc) => {
      const accountInfo = await connection.getParsedAccountInfo(acc.address)
      const owner = accountInfo.value?.data?.parsed?.info?.owner
      return { owner, amount: acc.amount }
    }),
  )

  const top10supply = top10.reduce((sum, acc) => sum + Number(acc.amount), 0)
  const totalSupplyAmount = Number(totalSupply.value.amount)
  const tenPercent = (top10supply / totalSupplyAmount) * 100

  return {
    top10Holders: top10WithOwners.map((acc) => ({
      address: acc.owner ?? 'Unknown',
      balance: acc.amount,
    })),
    top10Percentage: tenPercent.toFixed(2),
  }
}

export async function getHolderConditions(tokenAddress) {
  let cursor = null
  const owners = new Set()

  while (true) {
    const body = {
      jsonrpc: '2.0', // FIX: was "jsonprc" (typo, invalid JSON-RPC field name)
      id: 'holder account',
      method: 'getTokenAccounts', // FIX: was "getTokensAccount" (not a real Helius method)
      params: {
        mint: tokenAddress,
        limit: 1000,
        ...(cursor ? { cursor } : {}),
      },
    }
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    const accounts = data.result?.token_accounts ?? []

    if (accounts.length === 0) break // FIX: was "account.length" (undefined variable)

    for (const acc of accounts) owners.add(acc.owner)

    cursor = data.result?.cursor // FIX: cursor was never updated, so pagination never advanced
    if (!cursor) break
  }
  return owners.size
}