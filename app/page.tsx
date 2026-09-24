'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TideGraph } from '@/components/tide-graph';
import { TideInfoCards } from '@/components/tide-info-cards';
import { MoonPhase } from '@/components/moon-phase';
import { WeeklyForecastCard } from '@/components/weekly-forecast';
import { MonthlyTideCalendar } from '@/components/monthly-tide-calendar';
import { LocationInfo } from '@/components/location-info';
import { NearbyPlaces } from '@/components/nearby-places';
import { TokunoshimaSpots } from '@/components/tokunoshima-spots';
import { InfoSources } from '@/components/info-sources';
import { NewsHeadlines } from '@/components/news-headlines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Waves, Calendar as CalendarIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
  import { useTideData, useWeatherData, useTyphoonData, getWeatherText } from '@/hooks/use-api-data';
import {
  calculateMoonPhase,
  type TideData,
  type WeeklyForecast,
} from '@/lib/tide-data';

// サンプルの周辺施設データ
// APIデータをアプリの形式に変換する関数
function convertApiTideData(apiData: ReturnType<typeof useTideData>['tideData'], date: Date): TideData | null {
  if (!apiData?.tide?.chart) return null;
  
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dayData = apiData.tide.chart[dateKey];
  
  if (!dayData) return null;
  
  const moonPhaseData = calculateMoonPhase(date);
  
  // 満潮・干潮データを変換
  const highTides = (dayData.flood || []).map(t => ({
    time: t.time,
    height: t.cm,
  }));
  
  const lowTides = (dayData.edd || []).map(t => ({
    time: t.time,
    height: t.cm,
  }));
  
  // 1時間ごとの潮位データを生成
  const hourlyTides: number[] = [];
  const tidePoints = dayData.tide || [];
  
  for (let hour = 0; hour < 24; hour++) {
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    const point = tidePoints.find(t => t.time === timeStr);
    if (point) {
      hourlyTides.push(point.cm);
    } else {
      // 補間
      const prevPoints = tidePoints.filter(t => t.time < timeStr);
      const nextPoints = tidePoints.filter(t => t.time > timeStr);
      const prev = prevPoints[prevPoints.length - 1];
      const next = nextPoints[0];
      
      if (prev && next) {
        const prevHour = parseInt(prev.time.split(':')[0]);
        const nextHour = parseInt(next.time.split(':')[0]);
        const ratio = (hour - prevHour) / (nextHour - prevHour);
        hourlyTides.push(Math.round(prev.cm + (next.cm - prev.cm) * ratio));
      } else if (prev) {
        hourlyTides.push(prev.cm);
      } else if (next) {
        hourlyTides.push(next.cm);
      } else {
        hourlyTides.push(100);
      }
    }
  }
  
  return {
    date: dateKey,
    tideName: dayData.moon?.title || moonPhaseData.tideName,
    moonAge: dayData.moon?.age ?? moonPhaseData.moonAge,
    moonPhase: moonPhaseData.phase,
    moonBrightness: dayData.moon?.brightness ? parseFloat(dayData.moon.brightness) : undefined,
    highTides,
    lowTides,
    hourlyTides,
    sunrise: dayData.sun?.rise || '06:00',
    sunset: dayData.sun?.set || '18:00',
    moonrise: dayData.moon?.rise?.split(' ').pop() || '--:--',
    moonset: dayData.moon?.set?.split(' ').pop() || '--:--',
  };
}

// 月間データを変換
function convertApiMonthlyTideData(apiData: ReturnType<typeof useTideData>['tideData']): TideData[] {
  if (!apiData?.tide?.chart) return [];
  
  const result: TideData[] = [];
  
  Object.keys(apiData.tide.chart).sort().forEach(dateKey => {
    const dayData = apiData.tide.chart[dateKey];
    const date = new Date(dateKey);
    const moonPhaseData = calculateMoonPhase(date);
    
    const highTides = (dayData.flood || []).map(t => ({
      time: t.time,
      height: t.cm,
    }));
    
    const lowTides = (dayData.edd || []).map(t => ({
      time: t.time,
      height: t.cm,
    }));
    
    const hourlyTides: number[] = [];
    const tidePoints = dayData.tide || [];
    
    for (let hour = 0; hour < 24; hour++) {
      const point = tidePoints.find(t => parseInt(t.time.split(':')[0]) === hour);
      hourlyTides.push(point?.cm ?? 100);
    }
    
    result.push({
      date: dateKey,
      tideName: dayData.moon?.title || moonPhaseData.tideName,
      moonAge: dayData.moon?.age ?? moonPhaseData.moonAge,
      moonPhase: moonPhaseData.phase,
      highTides,
      lowTides,
      hourlyTides,
      sunrise: dayData.sun?.rise || '06:00',
      sunset: dayData.sun?.set || '18:00',
      moonrise: dayData.moon?.rise?.split(' ').pop() || '--:--',
      moonset: dayData.moon?.set?.split(' ').pop() || '--:--',
    });
  });
  
  return result;
}

// 気象庁データから週間予報を変換（奄美地方を優先）
function convertJmaWeeklyForecast(weatherData: ReturnType<typeof useWeatherData>['weatherData']): WeeklyForecast[] {
  if (!weatherData?.forecast) return [];
  
  const result: WeeklyForecast[] = [];
  
  // 今日・明日・明後日の天気（forecast[0]）
  const todayForecast = weatherData.forecast[0];
  if (todayForecast?.timeSeries?.[0]) {
    const weatherSeries = todayForecast.timeSeries[0];
    // 奄美地方（460040）を探す、なければ最初のエリア
    const amamiArea = weatherSeries.areas.find(a => a.area.code === '460040') || weatherSeries.areas[0];
    
    if (amamiArea) {
      weatherSeries.timeDefines.forEach((timeDefine, index) => {
        const date = new Date(timeDefine);
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        
        // 気温データを取得（timeSeries[2]に含まれる）
        // 気温の地点コードは異なる（名瀬: 88837）
        let highTemp = 28;
        let lowTemp = 23;
        if (todayForecast.timeSeries[2]?.areas) {
          // 名瀬（奄美）の気温データを優先的に探す
          const tempArea = todayForecast.timeSeries[2].areas.find(a => a.area.code === '88837') || 
                          todayForecast.timeSeries[2].areas.find(a => a.area.name?.includes('名瀬')) ||
                          todayForecast.timeSeries[2].areas[0];
          if (tempArea?.temps && tempArea.temps.length >= 4) {
            // temps配列の構造: [今日の日中, 今日の最高, 明日の最低, 明日の最高]
            // timeDefinesは [今日9時, 今日0時, 明日0時, 明日9時] のような構造
            if (index === 0) {
              // 今日
              highTemp = parseInt(tempArea.temps[1] || tempArea.temps[0] || '28') || 28;
              lowTemp = parseInt(tempArea.temps[2] || '23') || 23; // 明日の最低を今日の最低として使用（今日の最低は空の場合が多い）
            } else {
              // 明日以降
              highTemp = parseInt(tempArea.temps[3] || '28') || 28;
              lowTemp = parseInt(tempArea.temps[2] || '23') || 23;
            }
          }
        }
        
        // 降水確率（timeSeries[1]に含まれる）
        let precipitation = 0;
        if (todayForecast.timeSeries[1]?.areas) {
          const popArea = todayForecast.timeSeries[1].areas.find(a => a.area.code === '460040') ||
                         todayForecast.timeSeries[1].areas[0];
          if (popArea?.pops?.[0]) {
            precipitation = parseInt(popArea.pops[0]) || 0;
          }
        }
        
        // 波高を天気テキストから抽出
        let waveHeight = 1.5;
        const waveText = amamiArea.waves?.[index] || '';
        const waveMatch = waveText.match(/(\d+(?:\.\d+)?)/);
        if (waveMatch) {
          waveHeight = parseFloat(waveMatch[1]);
        }
        
        result.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          day: dayNames[date.getDay()],
          weather: amamiArea.weathers?.[index] || getWeatherText(amamiArea.weatherCodes?.[index] || '100'),
          weatherCode: amamiArea.weatherCodes?.[index] || '100',
          highTemp,
          lowTemp,
          precipitation,
          waveHeight,
        });
      });
    }
  }
  
  // 週間予報（forecast[1]）がある場合は追加
  if (weatherData.forecast[1]?.timeSeries?.[0]) {
    const weekSeries = weatherData.forecast[1].timeSeries[0];
    const amamiArea = weekSeries.areas.find(a => a.area.code === '460040') || weekSeries.areas[0];
    
    // 気温データ（週間予報の気温は地点コードで指定）
    const tempSeries = weatherData.forecast[1].timeSeries[1];
    // 名瀬（88837）または奄美地方の気温データを探す
    const tempArea = tempSeries?.areas?.find(a => a.area.code === '88837') || 
                    tempSeries?.areas?.find(a => a.area.name?.includes('名瀬')) ||
                    tempSeries?.areas?.[0];
    
    if (amamiArea) {
      weekSeries.timeDefines.forEach((timeDefine, index) => {
        const date = new Date(timeDefine);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        
        // 既に同じ日付のデータがあればスキップ
        if (result.some(r => r.date === dateStr)) return;
        
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        
        result.push({
          date: dateStr,
          day: dayNames[date.getDay()],
          weather: getWeatherText(amamiArea.weatherCodes?.[index] || '100'),
          weatherCode: amamiArea.weatherCodes?.[index] || '100',
          highTemp: parseInt(tempArea?.tempsMax?.[index] || '28') || 28,
          lowTemp: parseInt(tempArea?.tempsMin?.[index] || '23') || 23,
          precipitation: parseInt(amamiArea.pops?.[index] || '0') || 0,
          waveHeight: 1.5,
        });
      });
    }
  }
  
  // 最大7日分に制限
  return result.slice(0, 7);
}

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // APIからデータを取得
  // 鹿児島県: pc=46, 山村湾（徳之島）: hc=35
  const { tideData: apiTideData, isLoading: tideLoading, isError: tideError, refresh: refreshTide } = useTideData({
    pc: '46',
    hc: '35',
    range: 'month',
  });
  
  // 気象庁API: 鹿児島県 460100
  const { weatherData: apiWeatherData, isLoading: weatherLoading, refresh: refreshWeather } = useWeatherData('460100');
  
  // 台風情報を取得
  const { typhoons, refresh: refreshTyphoon } = useTyphoonData();
  
  // APIデータをアプリ形式に変換
  const tideData = useMemo(() => {
    return convertApiTideData(apiTideData, currentDate);
  }, [apiTideData, currentDate]);
  
  // 昨日のデータを取得
  const yesterdayTideData = useMemo(() => {
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return convertApiTideData(apiTideData, yesterday);
  }, [apiTideData, currentDate]);
  
  // 明日のデータも取得
  const tomorrowTideData = useMemo(() => {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return convertApiTideData(apiTideData, tomorrow);
  }, [apiTideData, currentDate]);
  
  const monthlyTideData = useMemo(() => {
    return convertApiMonthlyTideData(apiTideData);
  }, [apiTideData]);
  
  const weeklyForecast = useMemo(() => {
    const jmaForecast = convertJmaWeeklyForecast(apiWeatherData);
    if (jmaForecast.length > 0) return jmaForecast;
    
    // フォールバック: モックデータ
    const { generateWeeklyForecast } = require('@/lib/tide-data');
    return generateWeeklyForecast(currentDate);
  }, [apiWeatherData, currentDate]);

  // 1分ごとに時刻を更新
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setLastUpdated(now);
    
    const interval = setInterval(() => {
      const newDate = new Date();
      setCurrentDate(newDate);
      setLastUpdated(newDate);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // データの手動更新
  const handleRefresh = () => {
    refreshTide();
    refreshWeather();
    refreshTyphoon();
    setLastUpdated(new Date());
  };

  const formatDate = (date: Date) => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${dayNames[date.getDay()]}）`;
  };

  // ローディング表示
  if (tideLoading && !tideData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Waves className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="mt-4 text-muted-foreground">潮汐データを取得中...</p>
          <p className="mt-2 text-xs text-muted-foreground">tide736.net APIから取得しています</p>
        </div>
      </div>
    );
  }
  
  // エラー表示（データがない場合はモックデータにフォールバック）
  const displayTideData = tideData || (() => {
    const { generateTideData } = require('@/lib/tide-data');
    return generateTideData(currentDate);
  })();
  
  const displayMonthlyData = monthlyTideData.length > 0 ? monthlyTideData : (() => {
    const { generateMonthlyTideData } = require('@/lib/tide-data');
    return generateMonthlyTideData(currentDate);
  })();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* APIエラー時の通知 */}
        {tideError && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm text-destructive">APIからのデータ取得に失敗しました。シミュレーションデータを表示しています。</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1">
              <RefreshCw className="w-4 h-4" />
              再試行
            </Button>
          </div>
        )}
        
        {/* データ���ース表示 */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            潮汐: {apiTideData ? 'tide736.net API' : 'シミュレーション'}
          </Badge>
          <Badge variant="outline" className="gap-1">
            天気: {apiWeatherData ? '気象庁API' : 'シミュレーション'}
          </Badge>
          {(tideLoading || weatherLoading) && (
            <Badge variant="secondary" className="gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              更新中
            </Badge>
          )}
        </div>
        
        {/* 地点情報 */}
        <section id="location" className="mb-6">
          <LocationInfo
            name={apiTideData?.tide?.port?.harbor_namej || '山村湾（徳之島）'}
            region="鹿児島県大島郡徳之島町"
            lat={apiTideData?.tide?.port?.latitude || 27.52}
            lng={apiTideData?.tide?.port?.longitude || 128.58}
            lastUpdated={lastUpdated}
          />
        </section>

        {/* 本日の潮汐情報 */}
        <section id="tide" className="mb-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg md:text-xl text-foreground flex items-center gap-2">
                    <Waves className="w-5 h-5 text-primary" />
                    本日の潮汐情報
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {displayTideData.tideName}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDate(currentDate)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* タイドグラフ */}
                <div className="lg:col-span-3">
                  <TideGraph 
                    tideData={displayTideData} 
                    yesterdayTideData={yesterdayTideData || undefined}
                    tomorrowTideData={tomorrowTideData || undefined}
                  />
                </div>
                
                {/* 月齢表示 */}
                <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg">
                  <MoonPhase 
                    phase={displayTideData.moonPhase} 
                    moonAge={displayTideData.moonAge}
                    brightness={displayTideData.moonBrightness}
                    size={100}
                  />
                  <Badge className="mt-3" variant="outline">
                    {displayTideData.tideName}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 潮汐詳細カード */}
        <section className="mb-6">
          <TideInfoCards tideData={displayTideData} />
        </section>

        {/* 週間天気予報 */}
        <section id="weather" className="mb-6">
          <WeeklyForecastCard 
            forecasts={weeklyForecast} 
            typhoons={typhoons}
            targetLat={apiTideData?.tide?.port?.latitude || 27.52}
            targetLng={apiTideData?.tide?.port?.longitude || 128.58}
          />
        </section>

        {/* 月間潮見表 */}
        <section id="calendar" className="mb-6">
          <MonthlyTideCalendar tideDataList={displayMonthlyData} />
        </section>

        {/* 徳之島 海のスポットマップ */}
        <section id="spots" className="mb-6">
          <TokunoshimaSpots />
        </section>

        {/* 周辺施設 */}
        <section id="map" className="mb-6">
          <NearbyPlaces />
        </section>

        {/* 地域の最新ニュース見出し */}
        <section id="news" className="mb-6">
          <NewsHeadlines />
        </section>

        {/* 地域情報リンク集 */}
        <section id="info" className="mb-6">
          <InfoSources />
        </section>
      </main>

      <Footer />
    </div>
  );
}
