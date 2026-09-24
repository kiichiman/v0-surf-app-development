import { NextRequest, NextResponse } from 'next/server';

// 気象庁 警報・注意報API
// 奄美地方: 460040
const WARNING_API_BASE = 'https://www.jma.go.jp/bosai/warning/data/warning';

// 警報・注意報コードの定義
const WARNING_CODES: Record<string, string> = {
  '02': '暴風雪警報',
  '03': '大雨警報',
  '04': '洪水警報',
  '05': '暴風警報',
  '06': '大雪警報',
  '07': '波浪警報',
  '08': '高潮警報',
  '10': '大雨注意報',
  '12': '大雪注意報',
  '13': '風雪注意報',
  '14': '雷注意報',
  '15': '強風注意報',
  '16': '波浪注意報',
  '17': '融雪注意報',
  '18': '洪水注意報',
  '19': '高潮注意報',
  '20': '濃霧注意報',
  '21': '乾燥注意報',
  '22': 'なだれ注意報',
  '23': '低温注意報',
  '24': '霜注意報',
  '25': '着氷注意報',
  '26': '着雪注意報',
  '32': '特別警報（暴風雪）',
  '33': '特別警報（大雨）',
  '35': '特別警報（暴風）',
  '36': '特別警報（大雪）',
  '37': '特別警報（波浪）',
  '38': '特別警報（高潮）',
};

export interface WarningInfo {
  code: string;
  name: string;
  status: string;
}

export interface WarningResponse {
  areaCode: string;
  areaName: string;
  reportDatetime: string;
  headlineText: string;
  warnings: WarningInfo[];
  hasActiveWarnings: boolean;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const areaCode = searchParams.get('area') || '460040'; // デフォルト: 奄美地方
  
  try {
    const response = await fetch(`${WARNING_API_BASE}/${areaCode}.json`, {
      cache: 'no-store', // 常に最新の警報・注意報を取得
    });
    
    if (!response.ok) {
      throw new Error(`Warning API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 警報・注意報を抽出
    const warnings: WarningInfo[] = [];
    
    if (data.areaTypes && data.areaTypes.length > 0) {
      for (const areaType of data.areaTypes) {
        for (const area of areaType.areas || []) {
          for (const warning of area.warnings || []) {
            // 現在発表中の警報・注意報のみ抽出
            // 「解除」「解除します」「なし」「空」以外はすべて有効とみなす
            const status = (warning.status || '').trim();
            const isCleared = 
              status === '' || 
              status.includes('解除') || 
              status.includes('なし');
            if (warning.code && !isCleared) {
              warnings.push({
                code: warning.code,
                name: WARNING_CODES[warning.code] || `警報コード${warning.code}`,
                status: status,
              });
            }
          }
        }
      }
    }
    
    // 重複を除去
    const uniqueWarnings = warnings.filter((warning, index, self) =>
      index === self.findIndex(w => w.code === warning.code)
    );
    
    const result: WarningResponse = {
      areaCode,
      areaName: '奄美地方',
      reportDatetime: data.reportDatetime,
      headlineText: data.headlineText || '',
      warnings: uniqueWarnings,
      hasActiveWarnings: uniqueWarnings.length > 0,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Warning API fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch warning data',
        warnings: [],
        hasActiveWarnings: false,
        headlineText: '',
      },
      { status: 500 }
    );
  }
}
