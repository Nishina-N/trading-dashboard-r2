import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import type { ScoreData } from '../types/data';

const COLORS = [
  '#2962FF', '#FF6D00', '#00C853', '#D500F9', '#FFD600',
  '#00B8D4', '#FF1744', '#76FF03', '#F50057', '#00E5FF'
];

const DEFAULT_VISIBLE_BARS = 100;

export function createIndustryRRSChart(
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
  const top10Industries = latestData
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
    .slice(0, 10)
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

  const seriesMap = new Map<string, any>();
  const dataMap = new Map<string, any[]>();
  const visibilityMap = new Map<string, boolean>();

  const rankings = top10Industries.map((industry, index) => {
    const industryData = validData
      .filter(d => d.industry === industry && d.rank !== undefined)
      .map(d => ({
        time: d.date,
        value: d.rank!,
      }));

    const lineSeries = chart.addSeries(LineSeries, {
      color: COLORS[index % COLORS.length],
      lineWidth: 2,
    });

    lineSeries.setData(industryData);

    seriesMap.set(industry, lineSeries);
    dataMap.set(industry, industryData);
    visibilityMap.set(industry, true);

    return {
      name: industry,
      color: COLORS[index % COLORS.length],
      latestRank: industryData[industryData.length - 1]?.value || 999,
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
      
      legendItem.addEventListener('click', () => {
        const isVisible = visibilityMap.get(item.name);
        const series = seriesMap.get(item.name);
        const originalData = dataMap.get(item.name);
        
        if (isVisible) {
          series.setData([]);
          legendItem.style.opacity = '0.4';
          visibilityMap.set(item.name, false);
        } else {
          series.setData(originalData);
          legendItem.style.opacity = '1';
          visibilityMap.set(item.name, true);
        }
      });
      
      legendContainer.appendChild(legendItem);
    });

  window.addEventListener('resize', () => {
    chart.applyOptions({ width: chartContainer.clientWidth });
  });

  return chart;
}
