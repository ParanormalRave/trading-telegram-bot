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
          color: { up: '#3dd4df', down: '#160302', unchanged: '#999999' },
        },
      ],
    },
    options: {
      scales: {
        x: { type: 'time', time: { unit: 'hour' }, grid: { display: false }, ticks: { color: '#cccccc' } },
        y: { type: 'linear', grid: { display: false }, ticks: { color: '#cccccc' } },
      },
    },
    backgroundColor: '#131722',
  }

  const response = await fetch('https://quickchart.io/chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: '3', width: 600, height: 400, backgroundColor: '#131722', chart: chartConfig }),
  })

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}