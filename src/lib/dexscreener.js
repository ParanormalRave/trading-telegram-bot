const getTokeninfo = async (address) => {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
  const data = await res.json();

  if (!data.pairs || data.pairs.length === 0) return null
  // finding the real market data
  const pair = data.pairs.sort((a,b)=> b.liquidity.usd - a.liquidity.usd) [0];
  return {
    address,
    name: pair.baseToken.name,
    Symbol: pair.baseToken.symbol,
    priceUsd: pair.priceUsd,
    priceChange24h: pair.priceChange.h24,
    liquidityUsd: pair.liquidity.usd,
    volume24h: pair.volume.h24,
    marketCap: pair.marketCap ?? null,
    dex: pair.dexId,
    pairAddress: pair.pairAddress,
    chartUrl: pair.url,
    fetchedAt: new Date().toISOString(),
  }
}

export async function getTokenInfoWithFallback(address){
  try{
    const dex = await getTokeninfo(address)
    if (dex) return dex
  }catch(e){
    console.warn("Dex Screeener is not connected, trying coingecko")
  }

  const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${address}`)
  const data = await res.json()
  const attrs = data.data.attributes


  return {
    name: attrs.name,
    symbol: attrs.symbol,
    priceUsd: attrs.price_usd,
    marketCap: attrs.market_cap_usd,
    source: `geckoterminal`
  }
}

export async function getPriceHistory(poolAddress){
  const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/hour`)
  const data = await res.json()

  const candles = await data.data.attributes.ohlcv_list
  return candles.map(([timestamp, open, high, low, close]) => ({
    time: new Date(timestamp*1000).toLocaleTimeString(),
    price: close,
  })).reverse()
}