export interface Env {
  STOCK_DATA: R2Bucket;
  ALLOWED_ORIGINS?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// NaN を null に変換する関数
function sanitizeJSON(text: string): string {
  // NaN を null に置換
  return text.replace(/:\s*NaN\s*([,}])/g, ': null$1');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ルート: /api/stocks/core/{year}/{symbol}
      if (url.pathname.startsWith('/api/stocks/core/')) {
        const match = url.pathname.match(/^\/api\/stocks\/core\/(\d{4})\/(.+)$/);
        if (!match) {
          return new Response(JSON.stringify({ error: 'Invalid path format' }), { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const [, year, encodedSymbol] = match;
        const symbol = decodeURIComponent(encodedSymbol);
        const key = `stocks/daily/core/${year}/${symbol}.json`;
        
        const object = await env.STOCK_DATA.get(key);
        
        if (!object) {
          return new Response(JSON.stringify({ error: 'Not found', key }), { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const text = await object.text();
        const sanitized = sanitizeJSON(text);
        
        return new Response(sanitized, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
      
      // ルート: /api/scores/{scoreType}/{category}/{year}
      if (url.pathname.startsWith('/api/scores/')) {
        const match = url.pathname.match(/^\/api\/scores\/(RS_scores|RRS_scores)\/(individual|sector|industry)\/(\d{4})$/);
        if (!match) {
          return new Response(JSON.stringify({ error: 'Invalid path format' }), { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const [, scoreType, category, year] = match;
        const key = `scores/${scoreType}/${category}/${year}.json`;
        
        const object = await env.STOCK_DATA.get(key);
        
        if (!object) {
          return new Response(JSON.stringify({ error: 'Not found', key }), { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const text = await object.text();
        const sanitized = sanitizeJSON(text);
        
        return new Response(sanitized, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // ルート: /api/stocks/summary/dates?limit=N を追加
      if (url.pathname === '/api/stocks/summary/dates') {
        const limit = parseInt(url.searchParams.get('limit') || '30');
        
        console.log(`Listing available summary dates (limit: ${limit})...`);
        
        // stocks/summary/ 配下のファイル一覧を取得
        const list = await env.STOCK_DATA.list({
          prefix: 'stocks/summary/',
          limit: 1000  // 最大1000件取得
        });
        
        // ファイル名から日付を抽出してソート（降順）
        const dates = list.objects
          .map(obj => obj.key.replace('stocks/summary/', '').replace('.json', ''))
          .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))  // 日付形式チェック
          .sort((a, b) => b.localeCompare(a))  // 降順ソート
          .slice(0, limit);  // 最新N件
        
        console.log(`Found ${dates.length} available dates`);
        
        return new Response(JSON.stringify({
          dates,
          count: dates.length
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',  // 5分キャッシュ
          },
        });
      }


      // ルート: /api/stocks/summary/{date} を追加
      if (url.pathname.startsWith('/api/stocks/summary/')) {
        const match = url.pathname.match(/^\/api\/stocks\/summary\/(\d{4}-\d{2}-\d{2})$/);
        if (!match) {
          return new Response(JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }), { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const [, date] = match;
        const key = `stocks/summary/${date}.json`;
        
        console.log('Fetching summary with key:', key);
        
        const object = await env.STOCK_DATA.get(key);
        
        if (!object) {
          return new Response(JSON.stringify({ error: 'Not found', key }), { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const text = await object.text();
        const sanitized = sanitizeJSON(text);
        
        return new Response(sanitized, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }


      // ルート: /api/metadata
      if (url.pathname === '/api/metadata') {
        const key = 'metadata/last-updated.json';
        
        const object = await env.STOCK_DATA.get(key);
        
        if (!object) {
          const list = await env.STOCK_DATA.list({ prefix: 'metadata/', limit: 10 });
          
          return new Response(JSON.stringify({ 
            error: 'Metadata not found',
            key,
            available_files: list.objects.map(o => o.key),
          }), { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const text = await object.text();
        const sanitized = sanitizeJSON(text);
        
        return new Response(sanitized, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
          },
        });
      }

      // ルート: / (ヘルスチェック)
      if (url.pathname === '/' || url.pathname === '/api') {
        return new Response(JSON.stringify({
          name: 'Trading Dashboard API',
          version: '1.0.0',
          endpoints: [
            'GET /api/stocks/core/{year}/{symbol}',
            'GET /api/scores/{RS_scores|RRS_scores}/{individual|sector|industry}/{year}',
            'GET /api/metadata',
          ],
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('API Error:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
