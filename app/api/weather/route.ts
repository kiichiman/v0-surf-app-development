import { NextRequest, NextResponse } from 'next/server';

// 気象庁API
// 鹿児島県: 460100, 奄美地方は鹿児島県に含まれる
const JMA_FORECAST_BASE = 'https://www.jma.go.jp/bosai/forecast/data/forecast';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const areaCode = searchParams.get('area') || '460100'; // 鹿児島県
  
  try {
    // 天気予報を取得（常に最新を取得）
    const forecastResponse = await fetch(
      `${JMA_FORECAST_BASE}/${areaCode}.json`,
      { cache: 'no-store' }
    );
    
    if (!forecastResponse.ok) {
      throw new Error(`JMA Forecast API error: ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();
    
    return NextResponse.json({
      forecast: forecastData,
      warnings: null,
    });
  } catch (error) {
    console.error('JMA API fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
