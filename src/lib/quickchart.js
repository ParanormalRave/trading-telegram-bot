export async function generateCandleStickChart(priceHistory) {
  const chartConfig = {
    type: 'candlestick',
    data: {
      datasets: [
        {
          label: 'Price (USD)',
          data: priceHistory.map((c) => ({
            x: c.timestamp,
            o: c.open,
            h: c.high,
            l: c.low,
            c: c.close,
          })),
          color: {
            up: '#26a69a',
            down: '#ef5350',
            unchanged: '#999999',
          },
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: 'time', 
          time: { unit: 'hour' },
          grid: { color: '#333333' },
          ticks: { color: '#cccccc' },
        },
        y: {
          type: 'linear',
          grid: { color: '#333333' },
          ticks: { color: '#cccccc' },
        },
      },
    },
    backgroundColor: '#131722',
  }
  const url = `https://quickchart.io/chart?v=3&w=600&h=400&c=${encodeURIComponent(JSON.stringify(chartConfig))}`
  console.log(url)
  console.log(`Price History: ${priceHistory?.length}`)
  return url
}
