import { generateCandleStickChart } from "./src/lib/quickchart.js";
import { getPriceHistory } from "./src/lib/dexscreener.js";

async function runtime() {
  const poolAddress = "5YsszVi1235tJSdoxLRz5dXKuXX7cS5D2vLLWqL3jdS"
  console.log("pool address accepted.....fetching data now")
  const priceHistory = await getPriceHistory(poolAddress)
  console.log(`got ${priceHistory?.length} candles`)
  console.log(priceHistory?.slice(0,3))

  if(!priceHistory || priceHistory.length === 0){
    console.log('No OHLC data returned — stopping here, chart function has nothing to work with')
    return
  }

  console.log('generating url')
  const charturl = await generateCandleStickChart(priceHistory)
  console.log(`Chart Url: ${charturl}`)
}

runtime()