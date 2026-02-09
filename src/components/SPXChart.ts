import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { SPXData } from '../types/data';

export function createSPXChart(containerId: string, data: SPXData) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container not found:', containerId);
    return;
  }

  const chart = createChart(container, {
    layout: {
      background: { type: ColorType.Solid, color: '#131722' },
      textColor: '#d1d4dc',
    },
    grid: {
      vertLines: { color: '#1e222d' },
      horzLines: { color: '#1e222d' },
    },
    width: container.clientWidth,
    height: 400,
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
    },
  });

  const candlestickSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  const chartData = data.data
    .filter(d => d.open && d.high && d.low && d.close)
    .map(d => ({
      time: d.date,
      open: d.open!,
      high: d.high!,
      low: d.low!,
      close: d.close!,
    }));

  console.log('SPX chart data points:', chartData.length);
  candlestickSeries.setData(chartData);

  window.addEventListener('resize', () => {
    chart.applyOptions({ width: container.clientWidth });
  });

  return chart;
}
