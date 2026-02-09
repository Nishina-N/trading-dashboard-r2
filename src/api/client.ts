const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

export async function fetchSPXData(year: number): Promise<any> {
  const response = await fetch(`${API_BASE}/api/stocks/core/${year}/^GSPC`);
  if (!response.ok) throw new Error('Failed to fetch S&P500 data');
  return response.json();
}

export async function fetchSectorRS(year: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/scores/RS_scores/sector/${year}`);
  if (!response.ok) throw new Error('Failed to fetch Sector RS');
  return response.json();
}

export async function fetchSectorRRS(year: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/scores/RRS_scores/sector/${year}`);
  if (!response.ok) throw new Error('Failed to fetch Sector RRS');
  return response.json();
}

export async function fetchIndustryRS(year: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/scores/RS_scores/industry/${year}`);
  if (!response.ok) throw new Error('Failed to fetch Industry RS');
  return response.json();
}

export async function fetchIndustryRRS(year: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/scores/RRS_scores/industry/${year}`);
  if (!response.ok) throw new Error('Failed to fetch Industry RRS');
  return response.json();
}

export async function fetchMetadata(): Promise<any> {
  const response = await fetch(`${API_BASE}/api/metadata`);
  if (!response.ok) throw new Error('Failed to fetch metadata');
  return response.json();
}

// Summary データ取得
export async function fetchSummary(date: string): Promise<any> {
  const response = await fetch(`${API_BASE}/api/stocks/summary/${date}`);
  if (!response.ok) throw new Error(`Failed to fetch summary for ${date}`);
  return response.json();
}

// 利用可能な日付リストを取得
export async function fetchAvailableDates(limit: number = 30): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/stocks/summary/dates?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch available dates');
  const data = await response.json();
  return data.dates;
}

// 複数日のサマリーを並列取得
export async function fetchSummaries(dates: string[]): Promise<any[]> {
  const promises = dates.map(date => fetchSummary(date));
  return Promise.all(promises);
}
