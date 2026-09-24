import useSWR from 'swr';

// 潮汐APIのレスポンス型
export interface TideApiResponse {
  status: number;
  message: string;
  tide: {
    port: {
      prefecture_code: string;
      harbor_code: string;
      harbor_namej: string;
      latitude: number;
      longitude: number;
      level: number;
      harbor_name: string;
    };
    chart: {
      [date: string]: {
        sun: {
          astro_twilight: string;
          regular_twilight: string;
          rise: string;
          midline: string;
          set: string;
        };
        moon: {
          brightness: number;
          age: number;
          title: string;
          rise: string;
          midline: string;
          set: string;
          name: string;
        };
        edd: Array<{
          time: string;
          unix: number;
          cm: number;
        }>;
        flood: Array<{
          time: string;
          unix: number;
          cm: number;
        }>;
        tide: Array<{
          time: string;
          unix: number;
          cm: number;
        }>;
      };
    };
  };
}

// 気象庁APIのレスポンス型（簡略版）
export interface JmaWeatherResponse {
  forecast: Array<{
    publishingOffice: string;
    reportDatetime: string;
    timeSeries: Array<{
      timeDefines: string[];
      areas: Array<{
        area: {
          name: string;
          code: string;
        };
        weatherCodes?: string[];
        weathers?: string[];
        winds?: string[];
        waves?: string[];
        pops?: string[];
        temps?: string[];
        tempsMin?: string[];
        tempsMinUpper?: string[];
        tempsMinLower?: string[];
        tempsMax?: string[];
        tempsMaxUpper?: string[];
        tempsMaxLower?: string[];
        reliabilities?: string[];
      }>;
    }>;
  }>;
  warnings: unknown;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// 潮汐データを取得するフック
export function useTideData(options?: {
  pc?: string;
  hc?: string;
  range?: 'day' | 'week' | 'month';
}) {
  const params = new URLSearchParams();
  if (options?.pc) params.set('pc', options.pc);
  if (options?.hc) params.set('hc', options.hc);
  if (options?.range) params.set('rg', options.range);
  
  const queryString = params.toString();
  const url = `/api/tide${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<TideApiResponse>(
    url,
    fetcher,
    {
      refreshInterval: 60000, // 1分ごとに更新
      revalidateOnFocus: false,
    }
  );
  
  return {
    tideData: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// 天気予報データを取得するフック
export function useWeatherData(areaCode?: string) {
  const params = new URLSearchParams();
  if (areaCode) params.set('area', areaCode);
  
  const queryString = params.toString();
  const url = `/api/weather${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<JmaWeatherResponse>(
    url,
    fetcher,
    {
      refreshInterval: 180000, // 3分ごとに更新
      revalidateOnFocus: true,
    }
  );
  
  return {
    weatherData: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// 天気コードから天気アイコンを取得
export function getWeatherIcon(code: string): string {
  const codeNum = parseInt(code, 10);
  
  // 気象庁の天気コード対応
  if (codeNum >= 100 && codeNum < 200) return '☀️'; // 晴れ
  if (codeNum >= 200 && codeNum < 300) return '⛅'; // 曇り時々晴れ
  if (codeNum >= 300 && codeNum < 400) return '☁️'; // 曇り
  if (codeNum >= 400 && codeNum < 500) return '🌧️'; // 雨
  if (codeNum >= 500 && codeNum < 600) return '🌨️'; // 雪
  
  return '☀️';
}

// 天気コードから天気テキストを取得
export function getWeatherText(code: string): string {
  const weatherMap: Record<string, string> = {
    '100': '晴れ',
    '101': '晴れ時々曇り',
    '102': '晴れ一時雨',
    '103': '晴れ時々雨',
    '104': '晴れ一時雪',
    '105': '晴れ時々雪',
    '106': '晴れ一時雨か雪',
    '107': '晴れ時々雨か雪',
    '108': '晴れ一時雨か雷雨',
    '110': '晴れ後時々曇り',
    '111': '晴れ後曇り',
    '112': '晴れ後一時雨',
    '113': '晴れ後時々雨',
    '114': '晴れ後雨',
    '115': '晴れ後一時雪',
    '116': '晴れ後時々雪',
    '117': '晴れ後雪',
    '118': '晴れ後雨か雪',
    '119': '晴れ後雨か雷雨',
    '200': '曇り',
    '201': '曇り時々晴れ',
    '202': '曇り一時雨',
    '203': '曇り時々雨',
    '204': '曇り一時雪',
    '205': '曇り時々雪',
    '206': '曇り一時雨か雪',
    '207': '曇り時々雨か雪',
    '208': '曇り一時雨か雷雨',
    '210': '曇り後時々晴れ',
    '211': '曇り後晴れ',
    '212': '曇り後一時雨',
    '213': '曇り後時々雨',
    '214': '曇り後雨',
    '215': '曇り後一時雪',
    '216': '曇り後時々雪',
    '217': '曇り後雪',
    '218': '曇り後雨か雪',
    '219': '曇り後雨か雷雨',
    '300': '雨',
    '301': '雨時々晴れ',
    '302': '雨時々止む',
    '303': '雨時々雪',
    '304': '雨か雪',
    '306': '大雨',
    '308': '雨で雷を伴う',
    '309': '雨一時雪',
    '311': '雨後晴れ',
    '313': '雨後曇り',
    '314': '雨後時々雪',
    '315': '雨後雪',
    '400': '雪',
    '401': '雪時々晴れ',
    '402': '雪時々止む',
    '403': '雪時々雨',
    '406': '大雪',
    '407': '風雪強い',
    '409': '雪一時雨',
    '411': '雪後晴れ',
    '413': '雪後曇り',
    '414': '雪後雨',
  };
  
  return weatherMap[code] || '不明';
}

// 日付フォーマット
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  
  return `${month}/${day}(${weekday})`;
}

// 台風情報の型定義
export interface TyphoonInfo {
  id: string;
  number: string;
  name: {
    jp: string;
    en: string;
  };
  category: string;
  categoryName: string;
  issue: string;
  center: [number, number];
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
}

export interface TyphoonApiResponse {
  typhoons: TyphoonInfo[];
}

// 台風情報を取得するフック
export function useTyphoonData() {
  const { data, error, isLoading, mutate } = useSWR<TyphoonApiResponse>(
    '/api/typhoon',
    fetcher,
    {
      refreshInterval: 300000, // 5分ごとに更新
      revalidateOnFocus: true,
    }
  );
  
  return {
    typhoonData: data,
    typhoons: data?.typhoons || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// 台風が指定地点に近いかどうかを判定（km単位）
export function isTyphoonNearby(
  typhoonCenter: [number, number],
  targetLat: number,
  targetLng: number,
  thresholdKm: number = 500
): boolean {
  const [typhoonLat, typhoonLng] = typhoonCenter;
  
  // 簡易的な距離計算（ハバーサイン公式の簡略版）
  const R = 6371; // 地球の半径（km）
  const dLat = (targetLat - typhoonLat) * Math.PI / 180;
  const dLng = (targetLng - typhoonLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(typhoonLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= thresholdKm;
}

// 台風の予報日時が指定日付に該当するかチェック
export function getTyphoonForecastForDate(
  typhoon: TyphoonInfo,
  targetDate: Date
): TyphoonForecast | null {
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  for (const forecast of typhoon.forecasts) {
    const forecastDate = new Date(forecast.validtime).toISOString().split('T')[0];
    if (forecastDate === targetDateStr) {
      return forecast;
    }
  }
  
  return null;
}

// 警報・注意報の型定義
export interface WarningInfo {
  code: string;
  name: string;
  status: string;
}

export interface WarningApiResponse {
  areaCode: string;
  areaName: string;
  reportDatetime: string;
  headlineText: string;
  warnings: WarningInfo[];
  hasActiveWarnings: boolean;
}

// 警報・注意報を取得するフック
export function useWarningData(areaCode?: string) {
  const params = new URLSearchParams();
  if (areaCode) params.set('area', areaCode);
  
  const queryString = params.toString();
  const url = `/api/warning${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<WarningApiResponse>(
    url,
    fetcher,
    {
      refreshInterval: 180000, // 3分ごとに更新
      revalidateOnFocus: true,
    }
  );
  
  return {
    warningData: data,
    warnings: data?.warnings || [],
    hasActiveWarnings: data?.hasActiveWarnings || false,
    headlineText: data?.headlineText || '',
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ニュースの型定義
export interface NewsItem {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  isLocal: boolean;
}

export interface NewsApiResponse {
  localNews: NewsItem[];
  generalNews: NewsItem[];
  updatedAt: string;
}

// 地域ニュースを取得するフック
export function useNewsData() {
  const { data, error, isLoading, mutate } = useSWR<NewsApiResponse>(
    '/api/news',
    fetcher,
    {
      refreshInterval: 1800000, // 30分ごとに更新
      revalidateOnFocus: false,
    }
  );

  return {
    localNews: data?.localNews || [],
    generalNews: data?.generalNews || [],
    updatedAt: data?.updatedAt,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
