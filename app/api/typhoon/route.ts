import { NextResponse } from 'next/server';

// 気象庁 台風情報API
const TYPHOON_LIST_URL = 'https://www.jma.go.jp/bosai/typhoon/data/targetTc.json';

export interface TyphoonInfo {
  id: string;
  number: string;
  name: {
    jp: string;
    en: string;
  };
  category: string;
  categoryName: string; // 台風/強い台風/非常に強い台風など
  issue: string;
  center: [number, number]; // [lat, lng]
  pressure: number | null; // 中心気圧 (hPa)
  maxWind: number | null; // 最大風速 (m/s)
  maxGust: number | null; // 最大瞬間風速 (m/s)
  location: string; // 位置の説明
  course: string; // 進行方向
  speed: number | null; // 進行速度 (km/h)
  forecasts: TyphoonForecast[];
}

export interface TyphoonForecast {
  validtime: string;
  advancedHours: number;
  center: [number, number];
  pressure?: number | null;
  maxWind?: number | null;
}

// 台風階級の日本語名を取得
function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    'TD': '熱帯低気圧',
    'TS': '台風（弱い）',
    'STS': '台風（強い）',
    'TY': '非常に強い台風',
    'L': '熱帯低気圧',
  };
  return map[category] || '台風';
}

interface SpecPart {
  part: string | { jp: string; en: string };
  advancedHours?: number;
  pressure?: string;
  maximumWind?: {
    sustained?: { 'm/s'?: string };
    gust?: { 'm/s'?: string };
  };
  location?: string;
  course?: string;
  speed?: { 'km/h'?: string };
  category?: { jp: string; en: string };
  position?: { deg: [number, number] };
  validtime?: { JST: string };
  center?: [number, number];
}

export async function GET() {
  try {
    // 台風一覧を取得（キャッシュなしで常に最新）
    const listResponse = await fetch(TYPHOON_LIST_URL, {
      cache: 'no-store',
    });
    
    if (!listResponse.ok) {
      return NextResponse.json({ typhoons: [] });
    }
    
    const typhoonList = await listResponse.json();
    
    if (!typhoonList || typhoonList.length === 0) {
      return NextResponse.json({ typhoons: [] });
    }
    
    const typhoons: TyphoonInfo[] = [];
    
    for (const tc of typhoonList) {
      try {
        // forecast.json（進路予報）と specifications.json（中心気圧等の諸元）を並行取得
        const [forecastResponse, specResponse] = await Promise.all([
          fetch(`https://www.jma.go.jp/bosai/typhoon/data/${tc.tropicalCyclone}/forecast.json`, {
            cache: 'no-store',
          }),
          fetch(`https://www.jma.go.jp/bosai/typhoon/data/${tc.tropicalCyclone}/specifications.json`, {
            cache: 'no-store',
          }),
        ]);
        
        const forecastData = forecastResponse.ok ? await forecastResponse.json() : [];
        const specData: SpecPart[] = specResponse.ok ? await specResponse.json() : [];
        
        // タイトル情報
        const titlePart = forecastData.find((p: { part: string }) => p.part === 'title');
        
        // 実況の進路情報
        const analysisPart = forecastData.find((p: { advancedHours?: number }) => p.advancedHours === 0);
        
        // 諸元データ: タイトル部分
        const specTitle = specData.find((p) => p.part === 'title');
        
        // 諸元データ: 実況（advancedHours === 0、最新の中心気圧等）
        const specAnalysis = specData.find(
          (p) => p.advancedHours === 0 && p.pressure !== undefined
        );
        
        // 中心気圧を取得
        const pressure = specAnalysis?.pressure ? parseInt(specAnalysis.pressure) : null;
        const maxWind = specAnalysis?.maximumWind?.sustained?.['m/s'] 
          ? parseInt(specAnalysis.maximumWind.sustained['m/s']) 
          : null;
        const maxGust = specAnalysis?.maximumWind?.gust?.['m/s']
          ? parseInt(specAnalysis.maximumWind.gust['m/s'])
          : null;
        const location = specAnalysis?.location || '';
        const course = specAnalysis?.course || '';
        const speed = specAnalysis?.speed?.['km/h']
          ? parseInt(specAnalysis.speed['km/h'])
          : null;
        
        // カテゴリ名（諸元データを優先）
        const categoryJp = specAnalysis?.category?.jp || specTitle?.category;
        const categoryName = typeof categoryJp === 'object' && categoryJp !== null
          ? (categoryJp as { jp: string }).jp
          : (typeof categoryJp === 'string' ? categoryJp : getCategoryName(tc.category));
        
        // 予報情報
        const forecasts: TyphoonForecast[] = forecastData
          .filter((p: { advancedHours?: number }) => p.advancedHours !== undefined && p.advancedHours > 0)
          .map((p: { validtime?: { JST: string }; advancedHours: number; center?: [number, number] }) => ({
            validtime: p.validtime?.JST || '',
            advancedHours: p.advancedHours,
            center: p.center || [0, 0],
          }));
        
        // 中心位置（諸元のpositionを優先、なければforecastのcenter）
        const center = specAnalysis?.position?.deg || analysisPart?.center || [0, 0];
        
        typhoons.push({
          id: tc.tropicalCyclone,
          number: tc.typhoonNumber,
          name: titlePart?.name || specTitle?.name || { jp: `台風${tc.typhoonNumber}号`, en: '' },
          category: tc.category,
          categoryName,
          issue: tc.issue,
          center: center as [number, number],
          pressure,
          maxWind,
          maxGust,
          location,
          course,
          speed,
          forecasts,
        });
      } catch (err) {
        console.error(`Failed to fetch typhoon ${tc.tropicalCyclone}:`, err);
      }
    }
    
    return NextResponse.json({ typhoons });
  } catch (error) {
    console.error('Typhoon API fetch error:', error);
    return NextResponse.json({ typhoons: [] });
  }
}
