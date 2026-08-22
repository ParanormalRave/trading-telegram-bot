// test-dexscreener.js
async function getTokenInfo(address) {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
  const data = await res.json()

  console.log('Number of pairs found:', data.pairs?.length)

  if (!data.pairs || data.pairs.length === 0) return null

  // log each pair's liquidity BEFORE sorting, to spot missing data
  data.pairs.forEach((p, i) => {
    console.log(`Pair ${i}: liquidity =`, p.liquidity)
  })

  const pair = data.pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0]

  return {
    address,
    name: pair.baseToken.name,
    symbol: pair.baseToken.symbol,
    priceUsd: pair.priceUsd,
    liquidityUsd: pair.liquidity?.usd,
  }
}

// run it directly with a real token address
getTokenInfo('HmqNryXmwU2H7tYZwTyd3nqUnEiELGjxivgDocEPpump')
  .then((result) => console.log('RESULT:', result))
  .catch((err) => console.error('CRASHED:', err.message, err.stack))