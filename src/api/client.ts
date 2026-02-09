const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

export async function fetchSPXData(year: number): Promise<any> {
  const response = await fetch(`${API_BASE}/api/stocks/core/${year}/^GSPC`);
  if (!response.ok) throw new Error('Failed to fetch S&P500 data');
  return response.json();
}

// 複数年のS&P500データを取得して結合
export async function fetchSPXDataMultiYear(years: number[]): Promise<any> {
  const promises = years.map(year => fetchSPXData(year));
  const results = await Promise.all(promises);
  
  // 全データを結合
  const combined = {
    ticker: results[0].ticker,
    name: results[0].name,
    sector: results[0].sector,
    industry: results[0].industry,
    data: results.flatMap(r => r.data)
  };
  
  // 日付でソート
  combined.data.sort((a, b) => a.date.localeCompare(b.date));
  
  return combined;
}

export async function fetchSectorRS(year: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/scores/RS_scores/sector/${year}`);
  if (!response.ok) throw new Error('Failed to fetch Sector RS');
  return response.json();
}

// 複数年のSector RSを取得して結合
export async function fetchSectorRSMultiYear(years: number[]): Promise<any[]> {
  const promises = years.map(year => fetchSectorRS(year));
  const results = await Promise.all(promises);
  
  const combined = results.flat();
  combined.sort((a, b) => a.date.localeCompare(b.date));
  
  return combined;
}

export async function fetchSectorRRS(year: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/scores/RRS_scores/sector/${year}`);
  if (!response.ok) throw new Error('Failed to fetch Sector RRS');
  return response.json();
}

export async function fetchSectorRRSMultiYear(years: number[]): Promise<any[]> {
  const promises = years.map(year => fetchSectorRRS(year));
  const results = await Promise.all(promises);
  
  const combined = results.flat();
  combined.sort((a, b) => a.date.localeCompare(b.date));
  
  return combined;
}

export async function fetchIndustryRS(year: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/scores/RS_scores/industry/${year}`);
  if (!response.ok) throw new Error('Failed to fetch Industry RS');
  return response.json();
}

export async function fetchIndustryRSMultiYear(years: number[]): Promise<any[]> {
  const promises = years.map(year => fetchIndustryRS(year));
  const results = await Promise.all(promises);
  
  const combined = results.flat();
  combined.sort((a, b) => a.date.localeCompare(b.date));
  
  return combined;
}

export async function fetchIndustryRRS(year: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/scores/RRS_scores/industry/${year}`);
  if (!response.ok) throw new Error('Failed to fetch Industry RRS');
  return response.json();
}

export async function fetchIndustryRRSMultiYear(years: number[]): Promise<any[]> {
  const promises = years.map(year => fetchIndustryRRS(year));
  const results = await Promise.all(promises);
  
  const combined = results.flat();
  combined.sort((a, b) => a.date.localeCompare(b.date));
  
  return combined;
}

export async function fetchMetadata(): Promise<any> {
  const response = await fetch(`${API_BASE}/api/metadata`);
  if (!response.ok) throw new Error('Failed to fetch metadata');
  return response.json();
}

export async function fetchSummary(date: string): Promise<any> {
  const response = await fetch(`${API_BASE}/api/stocks/summary/${date}`);
  if (!response.ok) throw new Error(`Failed to fetch summary for ${date}`);
  return response.json();
}

export async function fetchAvailableDates(limit: number = 30): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/stocks/summary/dates?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch available dates');
  const data = await response.json();
  return data.dates;
}

export async function fetchSummaries(dates: string[]): Promise<any[]> {
  const promises = dates.map(date => fetchSummary(date));
  return Promise.all(promises);
}
