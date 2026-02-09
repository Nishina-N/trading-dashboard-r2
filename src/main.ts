import './styles/main.css';
import { createSPXChart } from './components/SPXChart';
import { createSectorRSChart } from './components/SectorRSChart';
import { createSectorRRSChart } from './components/SectorRRSChart';
import { createIndustryRSChart } from './components/IndustryRSChart';
import { createIndustryRRSChart } from './components/IndustryRRSChart';
import { createStockTable } from './components/StockTable';
import {
  fetchSPXDataMultiYear,
  fetchSectorRSMultiYear,
  fetchSectorRRSMultiYear,
  fetchIndustryRSMultiYear,
  fetchIndustryRRSMultiYear,
  fetchMetadata,
  fetchAvailableDates,
  fetchSummary,
} from './api/client';
import type { StockSummary, FilterSettings } from './types/data';

let currentSummaryData: StockSummary[] = [];
let availableDates: string[] = [];

async function loadCharts() {
  // 現在年と前年の2年分
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];

  console.log('Loading charts for years:', years);

  const spxData = await fetchSPXDataMultiYear(years);
  console.log('SPX data points:', spxData.data.length);
  createSPXChart('spx-chart', spxData);

  const sectorRSData = await fetchSectorRSMultiYear(years);
  console.log('Sector RS data points:', sectorRSData.length);
  createSectorRSChart('sector-rs-chart', 'sector-rs-legend', sectorRSData);

  const sectorRRSData = await fetchSectorRRSMultiYear(years);
  console.log('Sector RRS data points:', sectorRRSData.length);
  createSectorRRSChart('sector-rrs-chart', 'sector-rrs-legend', sectorRRSData);

  const industryRSData = await fetchIndustryRSMultiYear(years);
  console.log('Industry RS data points:', industryRSData.length);
  createIndustryRSChart('industry-rs-chart', 'industry-rs-legend', industryRSData);

  const industryRRSData = await fetchIndustryRRSMultiYear(years);
  console.log('Industry RRS data points:', industryRRSData.length);
  createIndustryRRSChart('industry-rrs-chart', 'industry-rrs-legend', industryRRSData);
}

async function populateDateSelector() {
  const dateSelector = document.getElementById('date-selector') as HTMLSelectElement;
  
  availableDates = await fetchAvailableDates(30);
  
  dateSelector.innerHTML = availableDates.map((date, index) => 
    `<option value="${date}">${date}${index === 0 ? ' (latest)' : ''}</option>`
  ).join('');
  
  console.log('Available dates loaded:', availableDates.length);
}

async function loadStockTable() {
  const dateSelector = document.getElementById('date-selector') as HTMLSelectElement;
  const selectedDate = dateSelector.value;
  
  if (!selectedDate) {
    console.error('No date selected');
    return;
  }
  
  console.log(`Loading summary for ${selectedDate}...`);
  
  const summary = await fetchSummary(selectedDate);
  currentSummaryData = summary.stocks;
  
  console.log(`Loaded ${currentSummaryData.length} stocks for ${selectedDate}`);
  
  updateStockTable();
}

function updateStockTable() {
  const filters: FilterSettings = {
    topSectors: parseInt((document.getElementById('topSectors-slider') as HTMLInputElement).value),
    topIndustries: parseInt((document.getElementById('topIndustries-slider') as HTMLInputElement).value),
    stocksPerSector: parseInt((document.getElementById('stocksPerSector-slider') as HTMLInputElement).value),
    stocksPerIndustry: parseInt((document.getElementById('stocksPerIndustry-slider') as HTMLInputElement).value),
    scoreThreshold: parseInt((document.getElementById('score-slider') as HTMLInputElement).value),
    days: 1,
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
  
  document.getElementById('apply-filters')!.addEventListener('click', async () => {
    await loadStockTable();
  });
}

async function main() {
  const lastUpdatedEl = document.getElementById('last-updated')!;
  
  try {
    const metadata = await fetchMetadata();
    lastUpdatedEl.textContent = `Last Updated: ${new Date(metadata.lastUpdated).toLocaleString()}`;

    await loadCharts();
    await populateDateSelector();
    setupFilterListeners();
    await loadStockTable();

    console.log('✅ Dashboard loaded successfully!');

  } catch (error) {
    console.error('Failed to load dashboard:', error);
    lastUpdatedEl.textContent = 'Error loading data';
  }
}

main();
