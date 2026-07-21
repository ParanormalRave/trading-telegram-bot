export async function generateChartImage(priceHistory){

  const chartConfig = {
    type: 'candlestick',
    data: {
      labels: priceHistory.map((p) => p.time),
      dataSet: [
        {
          label: 'Price (USD)',
          data: priceHistory.map((c) =>({
            x: c.timestamp,
            o: c.open,
            h: c.high,
            l: c.low,
            c: c.close,
          })),
        },
      ],
    },
    options: {
      scales: {
        x:{
          type: 'time',
          time: {unit: 'hour'},
        }
      },
    },
  }
  const url = `https://quickchart.io/chart?v=3&c=${encodeURIComponent(JSON.stringify(chartConfig))}`
  console.log(url)
  console.log(`Price History: ${priceHistory?.length}`)
  return url
}