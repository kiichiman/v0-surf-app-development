'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataSourceBadge } from '@/components/data-source-badge';
import type { WeeklyForecast } from '@/lib/tide-data';
import type { TyphoonInfo } from '@/hooks/use-api-data';
import { 
  Sun, 
  Cloud, 
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Waves,
  Droplets,
  AlertTriangle,
  Wind,
  Gauge,
  Navigation,
  MapPin
} from 'lucide-react';

interface WeeklyForecastCardProps {
  forecasts: WeeklyForecast[];
  typhoons?: TyphoonInfo[];
  targetLat?: number;
  targetLng?: number;
}

// 台風アイコンコンポーネント
const TyphoonIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2c1.5 2 2.5 4 2.5 6.5 0 2-1 4-2.5 5.5" />
    <path d="M12 22c-1.5-2-2.5-4-2.5-6.5 0-2 1-4 2.5-5.5" />
    <path d="M2 12c2 1.5 4 2.5 6.5 2.5 2 0 4-1 5.5-2.5" />
    <path d="M22 12c-2-1.5-4-2.5-6.5-2.5-2 0-4 1-5.5 2.5" />
  </svg>
);

const getWeatherIcon = (weather: string, hasTyphoon: boolean, size = 'w-8 h-8') => {
  // 台風接近時は台風アイコンを優先
  if (hasTyphoon) {
    return <TyphoonIcon className={`${size} text-red-500 animate-spin`} style={{ animationDuration: '3s' }} />;
  }
  
  const w = weather || '';
  if (w.includes('雪')) {
    return <CloudSnow className={`${size} text-blue-200`} />;
  }
  if (w.includes('雷')) {
    return <CloudLightning className={`${size} text-yellow-500`} />;
  }
  if (w.includes('雨')) {
    return <CloudRain className={`${size} text-blue-400`} />;
  }
  if ((w.includes('晴') && w.includes('曇')) || w.includes('時々')) {
    return <CloudSun className={`${size} text-yellow-400`} />;
  }
  if (w.includes('晴')) {
    return <Sun className={`${size} text-yellow-400`} />;
  }
  return <Cloud className={`${size} text-gray-400`} />;
};

// 天気説明文を短縮
const shortenWeather = (weather: string): string => {
  if (!weather) return '不明';
  let shortened = weather.replace(/\s+/g, ' ').trim();
  if (shortened.length > 15) {
    if (shortened.includes('雨')) {
      if (shortened.includes('くもり')) return '曇り時々雨';
      return '雨';
    }
    if (shortened.includes('晴')) {
      if (shortened.includes('くもり')) return '晴れ時々曇り';
      return '晴れ';
    }
    if (shortened.includes('くもり')) return '曇り';
    return shortened.slice(0, 12) + '...';
  }
  return shortened;
};

// 台風が指定日に近くにいるかチェック
// その日の台風の実際の位置（実況または予報進路）が近い場合のみ判定する
const getTyphoonForDate = (
  typhoons: TyphoonInfo[],
  forecastDate: string,
  targetLat: number,
  targetLng: number,
  thresholdKm: number = 500
): TyphoonInfo | null => {
  const year = new Date().getFullYear();
  const targetDate = new Date(`${year}/${forecastDate}`);
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  for (const typhoon of typhoons) {
    // 台風の発生（実況）日を取得
    const issueDateStr = new Date(typhoon.issue).toISOString().split('T')[0];
    
    // 1. 実況日が対象日と一致する場合は現在位置で判定
    if (issueDateStr === targetDateStr) {
      const currentDistance = calculateDistance(typhoon.center, targetLat, targetLng);
      if (currentDistance <= thresholdKm) {
        return typhoon;
      }
    }
    
    // 2. その日の予報位置が近いかチェック（予報進路にある日のみ）
    for (const forecast of typhoon.forecasts) {
      const forecastDateStr = new Date(forecast.validtime).toISOString().split('T')[0];
      if (forecastDateStr === targetDateStr) {
        const distance = calculateDistance(forecast.center, targetLat, targetLng);
        if (distance <= thresholdKm) {
          return typhoon;
        }
      }
    }
  }
  
  return null;
};

// 2点間の距離を計算（km）
const calculateDistance = (
  point: [number, number],
  targetLat: number,
  targetLng: number
): number => {
  const [lat, lng] = point;
  const R = 6371;
  const dLat = (targetLat - lat) * Math.PI / 180;
  const dLng = (targetLng - lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function WeeklyForecastCard({ 
  forecasts, 
  typhoons = [], 
  targetLat = 27.52, 
  targetLng = 128.58 
}: WeeklyForecastCardProps) {
  const getDayColor = (dayOfWeek: string) => {
    if (dayOfWeek === '日') return 'text-red-400';
    if (dayOfWeek === '土') return 'text-blue-400';
    return 'text-foreground';
  };
  
  // 台風が接近しているかどうか
  const hasActiveTyphoon = typhoons.length > 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg text-foreground">週間天気予報</CardTitle>
          <DataSourceBadge source="jma" size="sm" />
        </div>
        
        {/* 台風情報 */}
        {hasActiveTyphoon && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">台風情報（気象庁発表）</span>
            </div>
            {typhoons.map((typhoon) => (
              <div key={typhoon.id} className="mt-3">
                <div className="flex items-center gap-2">
                  <TyphoonIcon className="w-5 h-5 text-red-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-foreground font-bold text-base">
                    台風{typhoon.number}号「{typhoon.name.jp}」
                  </span>
                  {typhoon.categoryName && (
                    <Badge variant="destructive" className="text-[10px]">
                      {typhoon.categoryName}
                    </Badge>
                  )}
                </div>
                
                {/* 中心気圧を強調表示 */}
                {typhoon.pressure !== null && (
                  <div className="mt-3 flex items-center gap-3 p-2.5 bg-red-500/15 rounded-lg">
                    <Gauge className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground leading-none">中心気圧</p>
                      <p className="text-xl font-bold text-red-400 leading-tight">
                        {typhoon.pressure}<span className="text-sm ml-1">hPa</span>
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 詳細情報グリッド */}
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {typhoon.maxWind !== null && (
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="text-muted-foreground">最大風速</span>
                      <span className="text-foreground font-medium">{typhoon.maxWind}m/s</span>
                    </div>
                  )}
                  {typhoon.maxGust !== null && (
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                      <span className="text-muted-foreground">最大瞬間</span>
                      <span className="text-foreground font-medium">{typhoon.maxGust}m/s</span>
                    </div>
                  )}
                  {typhoon.course && (
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">進行方向</span>
                      <span className="text-foreground font-medium">
                        {typhoon.course}{typhoon.speed !== null ? ` ${typhoon.speed}km/h` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">中心</span>
                    <span className="text-foreground font-medium">
                      北緯{typhoon.center[0].toFixed(1)}° 東経{typhoon.center[1].toFixed(1)}°
                    </span>
                  </div>
                </div>
                
                {/* 位置の説明 */}
                {typhoon.location && (
                  <p className="text-muted-foreground text-xs mt-2">
                    位置: {typhoon.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 md:gap-4 min-w-max md:min-w-0 md:grid md:grid-cols-7">
            {forecasts.map((forecast, index) => {
              const dayOfWeek = forecast.day || forecast.dayOfWeek || '';
              const precipitation = typeof forecast.precipitation === 'number' 
                ? forecast.precipitation 
                : (Array.isArray(forecast.precipitation) ? Math.max(...forecast.precipitation) : 0);
              
              // この日に台風が近くにいるかチェック
              const typhoonForDay = getTyphoonForDate(
                typhoons,
                forecast.date,
                targetLat,
                targetLng
              );
              const hasTyphoonToday = typhoonForDay !== null;
              
              return (
                <div 
                  key={index}
                  className={`flex flex-col items-center p-3 md:p-4 rounded-lg ${
                    hasTyphoonToday 
                      ? 'bg-red-500/10 border border-red-500/30' 
                      : index === 0 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-secondary/30'
                  } min-w-[90px] md:min-w-0`}
                >
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-sm text-muted-foreground">{forecast.date}</span>
                    <span className={`text-sm font-medium ${getDayColor(dayOfWeek)}`}>
                      ({dayOfWeek})
                    </span>
                  </div>
                  
                  {/* 台風接近日は警告バッジ */}
                  {hasTyphoonToday && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mb-1">
                      <Wind className="w-3 h-3 mr-0.5" />
                      台風接近
                    </Badge>
                  )}
                  
                  <div className="my-2">
                    {getWeatherIcon(forecast.weather, hasTyphoonToday)}
                  </div>
                  
                  {/* 短縮天気説明 */}
                  <p className="text-[10px] text-center text-muted-foreground h-8 flex items-center">
                    {hasTyphoonToday ? '台風の影響あり' : shortenWeather(forecast.weather)}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-red-400 font-bold">{forecast.highTemp}°</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-blue-400">{forecast.lowTemp}°</span>
                  </div>
                  
                  {/* 降水確率 */}
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    <span className={precipitation >= 50 || hasTyphoonToday ? 'text-blue-400 font-medium' : 'text-muted-foreground'}>
                      {hasTyphoonToday ? '80%以上' : `${precipitation}%`}
                    </span>
                  </div>
                  
                  {/* 波高 */}
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Waves className="w-3 h-3 text-primary" />
                    <span className={hasTyphoonToday ? 'text-red-400 font-medium' : ''}>
                      {hasTyphoonToday ? '高波警戒' : `${typeof forecast.waveHeight === 'number' ? forecast.waveHeight.toFixed(1) : forecast.waveHeight}m`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
