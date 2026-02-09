import './styles/main.css';
import { createSPXChart } from './components/SPXChart';
import { createSectorRSChart } from './components/SectorRSChart';
import { createSectorRRSChart } from './components/SectorRRSChart';
import { createIndustryRSChart } from './components/IndustryRSChart';
import { createIndustryRRSChart } from './components/IndustryRRSChart';
import { createStockTable } from './components/StockTable';
import {
  fetchSPXData,
  fetchSectorRS,
  fetchSectorRRS,
  fetchIndustryRS,
  fetchIndustryRRS,
  fetchMetadata,
  fetchAvailableDates,
  fetchSummaries,
} from './api/client';
import type { StockSummary, FilterSettings } from './types/data';

let currentSummaryData: StockSummary[] = [];

async function loadCharts() {
  const currentYear = new Date().getFullYear();

  const spxData = await fetchSPXData(currentYear);
  createSPXChart('spx-chart', spxData);

  const sectorRSData = await fetchSectorRS(currentYear);
  createSectorRSChart('sector-rs-chart', 'sector-rs-legend', sectorRSData);

  const sectorRRSData = await fetchSectorRRS(currentYear);
  createSectorRRSChart('sector-rrs-chart', 'sector-rrs-legend', sectorRRSData);

  const industryRSData = await fetchIndustryRS(currentYear);
  createIndustryRSChart('industry-rs-chart', 'industry-rs-legend', industryRSData);

  const industryRRSData = await fetchIndustryRRS(currentYear);
  createIndustryRRSChart('industry-rrs-chart', 'industry-rrs-legend', industryRRSData);
}

async function loadStockTable() {
  const days = parseInt((document.getElementById('days-slider') as HTMLInputElement).value);
  
  console.log(`Loading last ${days} available days...`);
  
  // 利用可能な日付を取得（最新P件）
  const dates = await fetchAvailableDates(days);
  console.log('Available dates:', dates);
  
  if (dates.length === 0) {
    console.error('No summary data available');
    return;
  }
  
  // 並列取得
  const summaries = await fetchSummaries(dates);
  
  // 全データを結合
  currentSummaryData = summaries.flatMap(s => s.stocks);
  
  console.log(`Loaded ${currentSummaryData.length} stock records from ${dates.length} days`);
  
  // テーブル更新
  updateStockTable();
}

function updateStockTable() {
  const filters: FilterSettings = {
    topSectors: parseInt((document.getElementById('topSectors-slider') as HTMLInputElement).value),
    topIndustries: parseInt((document.getElementById('topIndustries-slider') as HTMLInputElement).value),
    stocksPerSector: parseInt((document.getElementById('stocksPerSector-slider') as HTMLInputElement).value),
    stocksPerIndustry: parseInt((document.getElementById('stocksPerIndustry-slider') as HTMLInputElement).value),
    scoreThreshold: parseInt((document.getElementById('score-slider') as HTMLInputElement).value),
    days: parseInt((document.getElementById('days-slider') as HTMLInputElement).value),
  };
  
  createStockTable('stock-table-container', currentSummaryData, filters);
}

function setupFilterListeners() {
  const topSectorsSlider = document.getElementById('topSectors-slider') as HTMLInputElement;
  const topSectorsValue = document.getElementById('topSectors-value')!;
  topSectorsSlider.addEventListener('input', () => {
    topSectorsValue.textContent = topSectorsSlider.value;
  });
  
  const stocksPerSectorSlider = document.getElementById('stocksPerSector-slider') as HTMLInputElement;
  const stocksPerSectorValue = document.getElementById('stocksPerSector-value')!;
  stocksPerSectorSlider.addEventListener('input', () => {
    stocksPerSectorValue.textContent = stocksPerSectorSlider.value;
  });
  
  const topIndustriesSlider = document.getElementById('topIndustries-slider') as HTMLInputElement;
  const topIndustriesValue = document.getElementById('topIndustries-value')!;
  topIndustriesSlider.addEventListener('input', () => {
    topIndustriesValue.textContent = topIndustriesSlider.value;
  });
  
  const stocksPerIndustrySlider = document.getElementById('stocksPerIndustry-slider') as HTMLInputElement;
  const stocksPerIndustryValue = document.getElementById('stocksPerIndustry-value')!;
  stocksPerIndustrySlider.addEventListener('input', () => {
    stocksPerIndustryValue.textContent = stocksPerIndustrySlider.value;
  });
  
  const scoreSlider = document.getElementById('score-slider') as HTMLInputElement;
  const scoreValue = document.getElementById('score-value')!;
  scoreSlider.addEventListener('input', () => {
    scoreValue.textContent = scoreSlider.value;
  });
  
  const daysSlider = document.getElementById('days-slider') as HTMLInputElement;
  const daysValue = document.getElementById('days-value')!;
  daysSlider.addEventListener('input', () => {
    daysValue.textContent = daysSlider.value;
  });
  
  document.getElementById('apply-filters')!.addEventListener('click', async () => {
    const newDays = parseInt(daysSlider.value);
    const currentDays = currentSummaryData.length > 0 ? 
      new Set(currentSummaryData.map(s => s.date)).size : 0;
    
    if (newDays !== currentDays) {
      await loadStockTable();
    } else {
      updateStockTable();
    }
  });
}

async function main() {
  const lastUpdatedEl = document.getElementById('last-updated')!;
  
  try {
    const metadata = await fetchMetadata();
    lastUpdatedEl.textContent = `Last Updated: ${new Date(metadata.lastUpdated).toLocaleString()}`;

    await loadCharts();
    setupFilterListeners();
    await loadStockTable();

    console.log('✅ Dashboard loaded successfully!');

  } catch (error) {
    console.error('Failed to load dashboard:', error);
    lastUpdatedEl.textContent = 'Error loading data';
  }
}

main();
