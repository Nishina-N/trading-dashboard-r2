import type { StockSummary, FilterSettings } from '../types/data';

let currentSortColumn: string | null = null;
let currentSortDirection: 'asc' | 'desc' = 'desc';

export function createStockTable(
  containerId: string,
  data: StockSummary[],
  filters: FilterSettings
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // フィルタリング
  const filtered = applyFilters(data, filters);

  // ソート適用
  const sorted = applySorting(filtered);

  // テーブル生成
  const table = `
    <div class="table-info">
      <p>Showing <strong>${sorted.length}</strong> stocks from ${data.length} total records</p>
    </div>
    <table class="stock-table">
      <thead>
        <tr>
          ${createHeader('symbol', 'Symbol')}
          ${createHeader('name', 'Name')}
          ${createHeader('sector', 'Sector')}
          ${createHeader('industry', 'Industry')}
          ${createHeader('rs', 'RS')}
          ${createHeader('rrs', 'RRS')}
          ${createHeader('sector_rs', 'Sector RS')}
          ${createHeader('sector_rrs', 'Sector RRS')}
          ${createHeader('industry_rs', 'Industry RS')}
          ${createHeader('industry_rrs', 'Industry RRS')}
        </tr>
      </thead>
      <tbody>
        ${sorted.map(stock => `
          <tr>
            <td><strong>${stock.symbol}</strong></td>
            <td class="stock-name">${stock.name}</td>
            <td>${stock.sector}</td>
            <td>${stock.industry}</td>
            <td class="score ${getScoreClass(stock.rs)}">${formatScore(stock.rs)}</td>
            <td class="score ${getScoreClass(stock.rrs)}">${formatScore(stock.rrs)}</td>
            <td class="score ${getScoreClass(stock.sector_rs)}">${formatScore(stock.sector_rs)}</td>
            <td class="score ${getScoreClass(stock.sector_rrs)}">${formatScore(stock.sector_rrs)}</td>
            <td class="score ${getScoreClass(stock.industry_rs)}">${formatScore(stock.industry_rs)}</td>
            <td class="score ${getScoreClass(stock.industry_rrs)}">${formatScore(stock.industry_rrs)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = table;

  // ヘッダークリックイベントを設定
  setupSortListeners(containerId, data, filters);
}

function createHeader(column: string, label: string): string {
  const isCurrent = currentSortColumn === column;
  const arrow = isCurrent 
    ? (currentSortDirection === 'asc' ? ' ▲' : ' ▼')
    : '';
  
  return `<th class="sortable" data-column="${column}">${label}${arrow}</th>`;
}

function setupSortListeners(
  containerId: string,
  data: StockSummary[],
  filters: FilterSettings
) {
  const headers = document.querySelectorAll(`#${containerId} .sortable`);
  
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.getAttribute('data-column');
      
      if (!column) return;
      
      if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = column;
        currentSortDirection = 'desc';
      }
      
      createStockTable(containerId, data, filters);
    });
  });
}

function applySorting(data: StockSummary[]): StockSummary[] {
  if (!currentSortColumn) {
    return [...data].sort((a, b) => (b.rs || 0) - (a.rs || 0));
  }

  return [...data].sort((a, b) => {
    const aValue = a[currentSortColumn as keyof StockSummary];
    const bValue = b[currentSortColumn as keyof StockSummary];

    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return currentSortDirection === 'asc' 
        ? aValue - bValue 
        : bValue - aValue;
    }

    const aStr = String(aValue);
    const bStr = String(bValue);
    
    return currentSortDirection === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });
}

function applyFilters(data: StockSummary[], filters: FilterSettings): StockSummary[] {
  // 1. スコア下限でフィルタ
  let filtered = data.filter(stock => 
    (stock.rs !== null && stock.rs >= filters.scoreThreshold) ||
    (stock.rrs !== null && stock.rrs >= filters.scoreThreshold)
  );

  // 2. TOP N セクターを取得
  const topSectors = getTopCategories(
    filtered, 
    'sector', 
    'sector_rs', 
    filters.topSectors
  );

  // 3. TOP N 業種を取得
  const topIndustries = getTopCategories(
    filtered, 
    'industry', 
    'industry_rs', 
    filters.topIndustries
  );

  // 4. AND条件: 両方のTOPリストに入っている銘柄のみ抽出
  const result: StockSummary[] = [];
  
  // セクター × 業種のマトリクスでループ
  topSectors.forEach(sector => {
    topIndustries.forEach(industry => {
      // このセクター AND この業種に属する銘柄を抽出
      const stocks = filtered
        .filter(s => s.sector === sector && s.industry === industry)
        .sort((a, b) => (b.rs || 0) - (a.rs || 0))
        .slice(0, Math.min(filters.stocksPerSector, filters.stocksPerIndustry));
      
      result.push(...stocks);
    });
  });

  // 重複除去（念のため）
  const unique = Array.from(new Map(result.map(s => [s.symbol, s])).values());
  
  return unique;
}

function getTopCategories(
  data: StockSummary[],
  categoryField: 'sector' | 'industry',
  scoreField: 'sector_rs' | 'industry_rs',
  topN: number
): string[] {
  const categoryScores = new Map<string, number>();

  data.forEach(stock => {
    const category = stock[categoryField];
    const score = stock[scoreField];
    
    if (category && score !== null) {
      if (!categoryScores.has(category) || categoryScores.get(category)! < score) {
        categoryScores.set(category, score);
      }
    }
  });

  return Array.from(categoryScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([category]) => category);
}

function formatScore(score: number | null): string {
  if (score === null) return '-';
  return score.toFixed(1);
}

function getScoreClass(score: number | null): string {
  if (score === null) return '';
  if (score >= 90) return 'score-high';
  if (score >= 70) return 'score-medium';
  return 'score-low';
}
