// S&P500 データ型
export interface SPXData {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  data: Array<{
    date: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number;
    rs_raw: number | null;
    rs_percentile: number | null;
    rrs_raw: number | null;
    rrs_percentile: number | null;
  }>;
}

// スコアデータ型
export interface ScoreData {
  date: string;
  sector?: string;
  industry?: string;
  rs_raw?: number;
  rs_percentile?: number;
  rrs_raw?: number;
  rrs_percentile?: number;
  rank: number;
  stock_count?: number;
}

// チャート用の時系列データ
export interface TimeSeriesData {
  time: string;
  value: number;
}

// ランキング用データ
export interface RankingItem {
  name: string;
  color: string;
  data: TimeSeriesData[];
  latestRank: number;
}

// Summary データ型
export interface StockSummary {
  date: string;
  symbol: string;
  name: string;
  sector: string;
  sector_rs: number | null;
  sector_rrs: number | null;
  industry: string;
  industry_rs: number | null;
  industry_rrs: number | null;
  rs: number | null;
  rrs: number | null;
}

export interface SummaryResponse {
  date: string;
  count: number;
  stocks: StockSummary[];
}

// フィルター設定（セクターと業種を分離）
export interface FilterSettings {
  topSectors: number;      // TOP N セクター
  topIndustries: number;   // TOP N 業種
  stocksPerSector: number; // 各セクターのTOP M銘柄
  stocksPerIndustry: number; // 各業種のTOP M銘柄
  scoreThreshold: number;  // RS/RRSスコア下限
  days: number;           // 直近P日
}
