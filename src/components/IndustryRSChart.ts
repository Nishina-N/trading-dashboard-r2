import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import type { ScoreData } from '../types/data';

const COLORS = [
  '#2962FF', '#FF6D00', '#00C853', '#D500F9', '#FFD600',
  '#00B8D4', '#FF1744', '#76FF03', '#F50057', '#00E5FF',
  '#6200EA', '#FF5252', '#00E676', '#FF9100', '#00BFA5',
  '#651FFF', '#FF6E40', '#00C853', '#FFC400', '#18FFFF'
];

const DEFAULT_VISIBLE_BARS = 100;

export function createIndustryRSChart(
  chartContainerId: string,
  legendContainerId: string,
  data: ScoreData[]
) {
  const chartContainer = document.getElementById(chartContainerId);
  const legendContainer = document.getElementById(legendContainerId);
  
  if (!chartContainer || !legendContainer) return;

  const validData = data.filter(d => 
    d.industry && 
    typeof d.industry === 'string' && 
    d.industry !== 'N/A'
  );

  const latestDate = validData[validData.length - 1]?.date;
  const latestData = validData.filter(d => d.date === latestDate);
  const top20Industries = latestData
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 20)
    .map(d => d.industry!);

  const chart = createChart(chartContainer, {
    layout: {
      background: { type: ColorType.Solid, color: '#131722' },
      textColor: '#d1d4dc',
    },
    grid: {
      vertLines: { color: '#1e222d' },
      horzLines: { color: '#1e222d' },
    },
    width: chartContainer.clientWidth,
    height: 400,
    rightPriceScale: {
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
      invertScale: true,
    },
  });

  const rankings = top20Industries.map((industry, index) => {
    const industryData = validData
      .filter(d => d.industry === industry)
      .map(d => ({
        time: d.date,
        value: d.rank,
      }));

    const lineSeries = chart.addSeries(LineSeries, {
      color: COLORS[index % COLORS.length],
      lineWidth: 2,
    });

    lineSeries.setData(industryData);

    return {
      name: industry,
      color: COLORS[index % COLORS.length],
      latestRank: industryData[industryData.length - 1]?.value || 0,
    };
  });

  const allDates = [...new Set(validData.map(d => d.date))].sort();
  if (allDates.length > DEFAULT_VISIBLE_BARS) {
    const from = allDates[allDates.length - DEFAULT_VISIBLE_BARS];
    const to = allDates[allDates.length - 1];
    chart.timeScale().setVisibleRange({ from, to });
  }

  legendContainer.innerHTML = '';
  rankings
    .sort((a, b) => a.latestRank - b.latestRank)
    .forEach(item => {
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <div class="legend-color" style="background: ${item.color}"></div>
        <div class="legend-label" title="${item.name}">${item.name}</div>
        <div class="legend-rank">#${item.latestRank}</div>
      `;
      legendContainer.appendChild(legendItem);
    });

  window.addEventListener('resize', () => {
    chart.applyOptions({ width: chartContainer.clientWidth });
  });

  return chart;
}
