export async function generateChartImage(priceHistory){
  const chartConfig = {
    type: 'candlestick',
    data: {
      labels: priceHistory.map((p) => p.time),
      dataSet: [
        {
          label: 'Price (USD)',
          data: ohlcData.map((c) =>({
            x: c.timestamp,
            o: c.open,
            h: c.high,
            l: c.low,
            c: c.close,
          })),
        },
      ],
    },
  }
  const url = `https://quickchart.io/chart?v=3&c=${encodeURIComponent(JSON.stringify(chartConfig))}`
  return url
}