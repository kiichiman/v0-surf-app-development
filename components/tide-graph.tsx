'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { TideData } from '@/lib/tide-data';
import { DataSourceBadge, type DataSourceType } from '@/components/data-source-badge';

interface TideGraphProps {
  tideData: TideData;
  yesterdayTideData?: TideData;
  tomorrowTideData?: TideData;
  dataSource?: DataSourceType;
}

// 3日分のデータから現在時刻を中心に前後24時間（48時間）のデータを生成
function generate48HourData(
  yesterdayData: TideData | undefined,
  todayData: TideData,
  tomorrowData: TideData | undefined,
  currentHour: number
): { time: number; height: number }[] {
  const points: { time: number; height: number }[] = [];
  
  const yesterdayHourly = yesterdayData?.hourlyTides || [];
  const todayHourly = todayData.hourlyTides || [];
  const tomorrowHourly = tomorrowData?.hourlyTides || [];
  
  // 現在時刻を中心に-24時間から+24時間まで（48時間分）
  for (let i = -24; i <= 24; i++) {
    const absoluteHour = Math.floor(currentHour) + i;
    let height: number;
    
    if (absoluteHour < 0) {
      // 昨日のデータ
      const yesterdayHour = absoluteHour + 24;
      height = yesterdayHourly[yesterdayHour] ?? todayHourly[yesterdayHour] ?? 100;
    } else if (absoluteHour < 24) {
      // 今日のデータ
      height = todayHourly[absoluteHour] ?? 100;
    } else {
      // 明日のデータ
      const tomorrowHour = absoluteHour - 24;
      height = tomorrowHourly[tomorrowHour] ?? todayHourly[tomorrowHour] ?? 100;
    }
    
    points.push({ time: i, height });
  }
  
  return points;
}

export function TideGraph({ tideData, yesterdayTideData, tomorrowTideData, dataSource = 'tide736' }: TideGraphProps) {
  // 横スクロールコンテナの参照
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 現在時刻（1分ごとに更新）
  const [currentHour, setCurrentHour] = useState(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });
  
  // マウント時に現在時刻（グラフ中央）が画面中央に来るよう自動スクロール
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // スクロール可能な幅がある場合のみ（スマホ表示時）中央へスクロール
    const scrollableWidth = container.scrollWidth - container.clientWidth;
    if (scrollableWidth > 0) {
      // グラフ全体の中央（現在時刻の位置）が画面中央に来るようスクロール
      container.scrollLeft = scrollableWidth / 2;
    }
  }, []);
  
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentHour(now.getHours() + now.getMinutes() / 60);
    };
    
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // 48時間分のグラフデータを生成（現在時刻が中央）
  const graphData = useMemo(() => 
    generate48HourData(yesterdayTideData, tideData, tomorrowTideData, currentHour), 
    [yesterdayTideData, tideData, tomorrowTideData, currentHour]
  );
  
  // 日の出・日の入り時刻
  const sunriseHour = parseFloat(tideData.sunrise?.replace(':', '.') || '6');
  const sunsetHour = parseFloat(tideData.sunset?.replace(':', '.') || '18');
  
  const startHour = Math.floor(currentHour);
  
  // 昨日の日没から今日の日の出まで（グラフ左側の暗い部分）
  const yesterdaySunset = sunsetHour - 24 - startHour; // 昨日の日没の相対位置
  const todaySunrise = sunriseHour - startHour; // 今日の日の出の相対位置
  const todaySunset = sunsetHour - startHour; // 今日の日没の相対位置
  const tomorrowSunrise = sunriseHour + 24 - startHour; // 明日の日の出の相対位置

  // X軸のラベルフォーマット
  const formatXAxis = (value: number) => {
    const hour = (startHour + value + 48) % 24; // 負の値対応
    if (value < -startHour) {
      return `前${hour}時`;
    } else if (startHour + value >= 24) {
      return `翌${hour}時`;
    }
    return `${hour}時`;
  };

  // 現在時刻の相対位置（常に0）
  const relativeCurrentTime = currentHour - startHour;

  // 24時間前と24時間後の時刻表示用
  const past24Hour = (startHour - 24 + 48) % 24;
  const future24Hour = (startHour + 24) % 24;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          前日{past24Hour}:00 〜 現在 〜 翌{future24Hour}:00（48時間）
        </span>
        <DataSourceBadge source={dataSource} size="sm" />
      </div>
      {/* 横スクロール可能なコンテナ */}
      <div ref={scrollContainerRef} className="overflow-x-auto -mx-4 px-4 pb-4">
        <div className="h-[320px] md:h-[380px] min-w-[800px] md:min-w-full">
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
            <defs>
              <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.65 0.18 220)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="oklch(0.65 0.18 220)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            {/* 夜の暗い時間帯を表示 */}
            {/* 昨日の日没〜今日の日の出 */}
            {yesterdaySunset >= -24 && todaySunrise <= 24 && (
              <ReferenceArea 
                x1={Math.max(-24, yesterdaySunset)} 
                x2={Math.min(24, todaySunrise)} 
                fill="#1a1f2e" 
                fillOpacity={0.5} 
              />
            )}
            {/* 今日の日没〜明日の日の出 */}
            {todaySunset >= -24 && tomorrowSunrise <= 24 && (
              <ReferenceArea 
                x1={Math.max(-24, todaySunset)} 
                x2={Math.min(24, tomorrowSunrise)} 
                fill="#1a1f2e" 
                fillOpacity={0.5} 
              />
            )}
            
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.03 230)" />
            
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'oklch(0.65 0.02 230)', fontSize: 12 }}
              tickFormatter={formatXAxis}
              ticks={[-24, -20, -16, -12, -8, -4, 0, 4, 8, 12, 16, 20, 24]}
              stroke="oklch(0.28 0.03 230)"
              domain={[-24, 24]}
              type="number"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            
            <YAxis 
              tick={{ fill: 'oklch(0.65 0.02 230)', fontSize: 12 }}
              tickFormatter={(value) => `${value}cm`}
              domain={[0, 200]}
              stroke="oklch(0.28 0.03 230)"
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(0.18 0.02 230)',
                border: '1px solid oklch(0.28 0.03 230)',
                borderRadius: '8px',
                color: 'oklch(0.95 0.01 230)',
              }}
              formatter={(value: number) => [`${Math.round(value)}cm`, '潮位']}
              labelFormatter={(label) => {
                const offset = label as number;
                const hour = (startHour + offset + 48) % 24;
                if (offset < -startHour) {
                  return `前日 ${hour}:00`;
                } else if (startHour + offset >= 24) {
                  return `翌日 ${hour}:00`;
                }
                return `${hour}:00`;
              }}
            />
            
            {/* 現在時刻のライン（中央） */}
            <ReferenceLine 
              x={relativeCurrentTime} 
              stroke="#f97316"
              strokeWidth={3}
              label={{ 
                value: `現在`, 
                position: 'top',
                fill: '#f97316',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            />
            
            <Area
              type="natural"
              dataKey="height"
              stroke="oklch(0.65 0.18 220)"
              strokeWidth={2}
              fill="url(#tideGradient)"
            />
          </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center md:hidden">
        左右にスワイプして時間を確認できます
      </p>
    </div>
  );
}
