import { NextRequest, NextResponse } from 'next/server';

// tide736.net API
// 鹿児島県: pc=46, 山村湾（徳之島）: hc=35
const TIDE_API_BASE = 'https://tide736.net/api/get_tide.php';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pc = searchParams.get('pc') || '46'; // 都道府県コード（鹿児島県）
  const hc = searchParams.get('hc') || '35'; // 港コード（山村湾）
  const range = searchParams.get('rg') || 'month'; // day, week, month
  
  const now = new Date();
  const yr = searchParams.get('yr') || now.getFullYear().toString();
  const mn = searchParams.get('mn') || (now.getMonth() + 1).toString().padStart(2, '0');
  const dy = searchParams.get('dy') || now.getDate().toString().padStart(2, '0');
  
  try {
    const params = new URLSearchParams({
      pc,
      hc,
      yr,
      mn,
      dy,
      rg: range,
    });
    
    const response = await fetch(`${TIDE_API_BASE}?${params.toString()}`, {
      next: { revalidate: 3600 }, // 1時間キャッシュ
    });
    
    if (!response.ok) {
      throw new Error(`Tide API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Tide API fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tide data' },
      { status: 500 }
    );
  }
}
