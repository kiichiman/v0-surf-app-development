// 潮汐データと気象データのユーティリティ

export interface TidePoint {
  time: string;
  height: number;
}

export interface TideData {
  date: Date | string;
  highTides: TidePoint[];
  lowTides: TidePoint[];
  hourlyTides?: number[];
  moonPhase: number; // 0-1 (0 = new moon, 0.5 = full moon)
  moonAge: number;
  moonBrightness?: number; // 輝面比 0-100%
  tideName: string; // 大潮、中潮、小潮、長潮、若潮
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
}

export interface WeatherData {
  time: string;
  weather: string;
  temperature: number;
  pressure: number;
  seaTemperature: number;
  tideHeight: number;
  windSpeed: number;
  windDirection: string;
  windDirectionDeg: number;
  waveHeight: number;
  wavePeriod: number;
  waveDirection: string;
  waveDirectionDeg: number;
}

export interface WeeklyForecast {
  date: string;
  day?: string;
  dayOfWeek?: string;
  weather: string;
  weatherCode?: string;
  highTemp: number;
  lowTemp: number;
  precipitation: number | number[];
  waveHeight: number;
}

export interface WeatherIndex {
  name: string;
  value: number;
  level: string;
  color: string;
}

// 正確な月齢計算（John Conway's algorithm をベースに）
export function calculateMoonAge(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 新月の基準日（2000年1月6日）からの経過日数
  const referenceDate = new Date(2000, 0, 6);
  const targetDate = new Date(year, month - 1, day);
  const diffTime = targetDate.getTime() - referenceDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // 朔望月の周期（約29.53日）
  const synodicMonth = 29.530588853;
  const moonAge = diffDays % synodicMonth;
  
  return moonAge < 0 ? moonAge + synodicMonth : moonAge;
}

// 潮回りの計算
export function getTideName(moonAge: number): string {
  const roundedAge = Math.round(moonAge);
  if (roundedAge <= 2 || roundedAge >= 28 || (roundedAge >= 14 && roundedAge <= 16)) {
    return '大潮';
  } else if ((roundedAge >= 3 && roundedAge <= 5) || (roundedAge >= 17 && roundedAge <= 19)) {
    return '中潮';
  } else if ((roundedAge >= 6 && roundedAge <= 8) || (roundedAge >= 20 && roundedAge <= 22)) {
    return '小潮';
  } else if (roundedAge === 9 || roundedAge === 23) {
    return '長潮';
  } else {
    return '若潮';
  }
}

// 月齢から月相（0-1）を計算
export function getMoonPhase(moonAge: number): number {
  return moonAge / 29.530588853;
}

// 月の位相データを計算（APIで使用）
export function calculateMoonPhase(date: Date): { phase: number; moonAge: number; tideName: string } {
  const moonAge = calculateMoonAge(date);
  return {
    phase: getMoonPhase(moonAge),
    moonAge: Math.round(moonAge * 10) / 10,
    tideName: getTideName(moonAge),
  };
}

// 日の出・日の入り計算（簡易版）
function calculateSunTimes(date: Date, lat: number, lng: number): { sunrise: string; sunset: string } {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // 太陽の赤緯（簡易計算）
  const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));
  
  // 日の出・日の入りの時角
  const latRad = lat * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);
  const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(decRad)) * (180 / Math.PI);
  
  // 時刻計算（UTC+9 日本時間）
  const solarNoon = 12 - (lng - 135) / 15; // 日本標準時の経度135度からの補正
  const sunriseHour = solarNoon - hourAngle / 15;
  const sunsetHour = solarNoon + hourAngle / 15;
  
  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  return {
    sunrise: formatTime(sunriseHour),
    sunset: formatTime(sunsetHour),
  };
}

// 月の出・月の入り計算（簡易版）
function calculateMoonTimes(date: Date, moonAge: number): { moonrise: string; moonset: string } {
  // 月の出は月齢に応じて約50分ずつ遅れる
  const baseRise = 6; // 新月時の月の出（おおよそ日の出と同じ）
  const delayPerDay = 50 / 60; // 1日あたりの遅れ（時間）
  
  let moonriseHour = (baseRise + moonAge * delayPerDay) % 24;
  let moonsetHour = (moonriseHour + 12) % 24;
  
  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  return {
    moonrise: formatTime(moonriseHour),
    moonset: formatTime(moonsetHour),
  };
}

// 潮汐データ生成（現在の日付に基づく）
export function generateTideData(date: Date, lat: number = 27.52, lng: number = 128.58): TideData {
  const moonAge = calculateMoonAge(date);
  const tideName = getTideName(moonAge);
  
  // 潮回りに応じた潮位変動
  const tideAmplitude = tideName === '大潮' ? 1.2 : 
                        tideName === '中潮' ? 1.0 : 
                        tideName === '小潮' ? 0.7 : 0.6;
  
  // 日付に基づく潮汐時刻の計算（月齢による位相シフト）
  const phaseShift = (moonAge / 29.53) * 12; // 時間単位の位相シフト
  
  const baseHighTide1 = (5 + phaseShift) % 24;
  const baseHighTide2 = (baseHighTide1 + 12.42) % 24;
  const baseLowTide1 = (baseHighTide1 + 6.21) % 24;
  const baseLowTide2 = (baseLowTide1 + 12.42) % 24;
  
  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  const baseHeight = 100;
  const variation = tideAmplitude * 60;
  
  const sunTimes = calculateSunTimes(date, lat, lng);
  const moonTimes = calculateMoonTimes(date, moonAge);
  
  return {
    date,
    highTides: [
      { time: formatTime(baseHighTide1), height: Math.round(baseHeight + variation + (Math.sin(date.getDate()) * 10)) },
      { time: formatTime(baseHighTide2), height: Math.round(baseHeight + variation - 5 + (Math.cos(date.getDate()) * 8)) },
    ].sort((a, b) => a.time.localeCompare(b.time)),
    lowTides: [
      { time: formatTime(baseLowTide1), height: Math.round(baseHeight - variation + (Math.sin(date.getDate() * 2) * 8)) },
      { time: formatTime(baseLowTide2), height: Math.round(baseHeight - variation + 5 + (Math.cos(date.getDate() * 2) * 6)) },
    ].sort((a, b) => a.time.localeCompare(b.time)),
    moonPhase: getMoonPhase(moonAge),
    moonAge: Math.round(moonAge * 10) / 10,
    tideName,
    ...sunTimes,
    ...moonTimes,
  };
}

// 24時間分のタイドグラフデータ生成
export function generateTideGraphData(tideData: TideData): { time: number; height: number }[] {
  const points: { time: number; height: number }[] = [];
  
  // APIデータにhourlyTidesがある場合はそれを使う
  if (tideData.hourlyTides && tideData.hourlyTides.length > 0) {
    for (let i = 0; i < tideData.hourlyTides.length; i++) {
      points.push({ time: i, height: tideData.hourlyTides[i] });
    }
    return points;
  }
  
  // 満潮・干潮のポイントが空の場合はデフォルト値を返す
  if (!tideData.highTides?.length && !tideData.lowTides?.length) {
    for (let hour = 0; hour < 24; hour++) {
      points.push({ time: hour, height: 100 + Math.sin(hour / 6 * Math.PI) * 50 });
    }
    return points;
  }
  
  // 満潮・干潮のポイントを時刻順にソート
  const allPoints = [
    ...(tideData.highTides || []).map(p => ({ ...p, isHigh: true })),
    ...(tideData.lowTides || []).map(p => ({ ...p, isHigh: false }))
  ].filter(p => p.time).sort((a, b) => {
    const timeA = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
    const timeB = parseInt(b.time.split(':')[0]) * 60 + parseInt(b.time.split(':')[1]);
    return timeA - timeB;
  });
  
  // ポイントが足りない場合はデフォルト値を返す
  if (allPoints.length < 2) {
    for (let hour = 0; hour < 24; hour++) {
      points.push({ time: hour, height: 100 + Math.sin(hour / 6 * Math.PI) * 50 });
    }
    return points;
  }
  
  // 0時から24時まで30分刻みでデータ生成
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const currentMinutes = hour * 60 + min;
      
      // 前後の潮位ポイントを見つけて補間
      let prevPoint = allPoints[allPoints.length - 1];
      let nextPoint = allPoints[0];
      let prevMinutes = parseInt(prevPoint.time.split(':')[0]) * 60 + parseInt(prevPoint.time.split(':')[1]);
      let nextMinutes = parseInt(nextPoint.time.split(':')[0]) * 60 + parseInt(nextPoint.time.split(':')[1]);
      
      for (let i = 0; i < allPoints.length; i++) {
        const pointMinutes = parseInt(allPoints[i].time.split(':')[0]) * 60 + parseInt(allPoints[i].time.split(':')[1]);
        if (pointMinutes <= currentMinutes) {
          prevPoint = allPoints[i];
          prevMinutes = pointMinutes;
          nextPoint = allPoints[(i + 1) % allPoints.length];
          nextMinutes = parseInt(nextPoint.time.split(':')[0]) * 60 + parseInt(nextPoint.time.split(':')[1]);
          if (nextMinutes < prevMinutes) nextMinutes += 24 * 60;
        }
      }
      
      // 日をまたぐ場合の調整
      let adjustedCurrent = currentMinutes;
      if (prevMinutes > currentMinutes) {
        prevMinutes -= 24 * 60;
      }
      if (nextMinutes < prevMinutes) {
        nextMinutes += 24 * 60;
      }
      if (adjustedCurrent < prevMinutes) {
        adjustedCurrent += 24 * 60;
      }
      
      // コサイン補間で滑らかな曲線を生成
      const duration = nextMinutes - prevMinutes;
      const elapsed = adjustedCurrent - prevMinutes;
      const progress = duration > 0 ? elapsed / duration : 0;
      const cosineProgress = (1 - Math.cos(progress * Math.PI)) / 2;
      
      const height = prevPoint.height + (nextPoint.height - prevPoint.height) * cosineProgress;
      
      points.push({ time: hour + min / 60, height: Math.max(0, Math.round(height)) });
    }
  }
  
  return points;
}

// 現在時刻を取得
export function getCurrentTime(): { hour: number; minute: number } {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

// 2時間毎の気象データ生成（現在時刻から開始）
export function generateHourlyWeather(startDate: Date = new Date()): WeatherData[] {
  const weatherTypes = ['晴れ', '曇り', '晴れ時々曇り', '曇り時々晴れ'];
  const windDirections = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  
  const data: WeatherData[] = [];
  const currentHour = startDate.getHours();
  const startHour = Math.floor(currentHour / 2) * 2; // 2時間単位に丸める
  
  // シード値として日付を使用（同じ日なら同じ結果）
  const dateSeed = startDate.getFullYear() * 10000 + (startDate.getMonth() + 1) * 100 + startDate.getDate();
  const seededRandom = (seed: number, index: number) => {
    const x = Math.sin(seed + index * 1234.5678) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < 24; i++) {
    const hourOffset = i * 2;
    const targetDate = new Date(startDate);
    targetDate.setHours(startHour + hourOffset, 0, 0, 0);
    
    const hour = targetDate.getHours();
    const dayOffset = Math.floor((startHour + hourOffset) / 24);
    const adjustedSeed = dateSeed + dayOffset;
    
    // 時刻に基づく気温変動（朝方最低、14時頃最高）
    const tempBase = 24 + seededRandom(adjustedSeed, 0) * 4;
    const tempVariation = Math.sin((hour - 5) / 24 * Math.PI * 2) * 5;
    
    // 風向きインデックス（ゆるやかに変化）
    const windDirIndex = Math.floor((seededRandom(adjustedSeed, 1) * 16 + i * 0.3) % 16);
    const waveDirIndex = Math.floor((seededRandom(adjustedSeed, 2) * 16 + i * 0.2) % 16);
    
    data.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      weather: weatherTypes[Math.floor(seededRandom(adjustedSeed, i + 10) * weatherTypes.length)],
      temperature: Math.round(tempBase + tempVariation),
      pressure: Math.round(1013 + seededRandom(adjustedSeed, i + 20) * 10 - 5),
      seaTemperature: Math.round(22 + seededRandom(adjustedSeed, 3) * 3),
      tideHeight: Math.round(80 + Math.sin((hour / 12) * Math.PI * 2) * 60),
      windSpeed: Math.round((3 + seededRandom(adjustedSeed, i + 30) * 5) * 10) / 10,
      windDirection: windDirections[windDirIndex],
      windDirectionDeg: windDirIndex * 22.5,
      waveHeight: Math.round((0.5 + seededRandom(adjustedSeed, i + 40) * 1.5) * 10) / 10,
      wavePeriod: Math.round((6 + seededRandom(adjustedSeed, i + 50) * 4) * 10) / 10,
      waveDirection: windDirections[waveDirIndex],
      waveDirectionDeg: waveDirIndex * 22.5,
    });
  }
  
  return data;
}

// 週間天気予報データ生成
export function generateWeeklyForecast(startDate: Date = new Date()): WeeklyForecast[] {
  const weatherTypes = ['晴れ', '曇り', '晴れ時々曇り', '曇り時々雨', '雨'];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  
  const forecasts: WeeklyForecast[] = [];
  
  // シード値として日付を使用
  const dateSeed = startDate.getFullYear() * 10000 + (startDate.getMonth() + 1) * 100 + startDate.getDate();
  const seededRandom = (seed: number, index: number) => {
    const x = Math.sin(seed + index * 1234.5678) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const daySeed = dateSeed + i;
    const weatherIndex = Math.floor(seededRandom(daySeed, 0) * weatherTypes.length);
    
    forecasts.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      dayOfWeek: dayNames[date.getDay()],
      weather: weatherTypes[weatherIndex],
      highTemp: Math.round(25 + seededRandom(daySeed, 1) * 5),
      lowTemp: Math.round(18 + seededRandom(daySeed, 2) * 4),
      precipitation: [
        Math.round(seededRandom(daySeed, 3) * 30),
        Math.round(seededRandom(daySeed, 4) * 40),
        Math.round(seededRandom(daySeed, 5) * 30),
        Math.round(seededRandom(daySeed, 6) * 20),
      ],
      waveHeight: Math.round((0.5 + seededRandom(daySeed, 7) * 2) * 10) / 10,
    });
  }
  
  return forecasts;
}

// 気象指数データ生成
export function generateWeatherIndices(date: Date = new Date()): WeatherIndex[] {
  const hour = date.getHours();
  const month = date.getMonth() + 1;
  
  // 時刻と季節に基づく指数計算
  const uvBase = month >= 5 && month <= 8 ? 8 : month >= 3 && month <= 10 ? 5 : 3;
  const uvValue = Math.min(11, Math.round(uvBase * (hour >= 10 && hour <= 14 ? 1.3 : hour >= 8 && hour <= 16 ? 1 : 0.5)));
  const uvLevel = uvValue >= 8 ? '非常に強い' : uvValue >= 6 ? '強い' : uvValue >= 3 ? 'やや強い' : '弱い';
  
  const heatBase = month >= 6 && month <= 9 ? 4 : 2;
  const heatValue = Math.min(5, Math.round(heatBase * (hour >= 12 && hour <= 15 ? 1.2 : 1)));
  const heatLevel = heatValue >= 4 ? '危険' : heatValue >= 3 ? '厳重警戒' : heatValue >= 2 ? '警戒' : '注意';
  
  // 日付に基づくシード
  const dateSeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  const umbrellaValue = Math.round(seededRandom(dateSeed + 100) * 100);
  const umbrellaLevel = umbrellaValue >= 70 ? '必要' : umbrellaValue >= 40 ? '念のため' : '��要';
  
  const tempValue = Math.round(24 + seededRandom(dateSeed + 200) * 6);
  const tempLevel = tempValue >= 28 ? '暑い' : tempValue >= 22 ? '快適' : '涼しい';
  
  return [
    {
      name: '紫外線',
      value: uvValue,
      level: uvLevel,
      color: uvValue >= 8 ? 'bg-red-500' : uvValue >= 6 ? 'bg-orange-500' : uvValue >= 3 ? 'bg-yellow-500' : 'bg-green-500',
    },
    {
      name: '熱中症',
      value: heatValue,
      level: heatLevel,
      color: heatValue >= 4 ? 'bg-red-500' : heatValue >= 3 ? 'bg-orange-500' : heatValue >= 2 ? 'bg-yellow-500' : 'bg-green-500',
    },
    {
      name: '傘指数',
      value: umbrellaValue,
      level: umbrellaLevel,
      color: umbrellaValue >= 70 ? 'bg-blue-600' : umbrellaValue >= 40 ? 'bg-blue-400' : 'bg-blue-300',
    },
    {
      name: '体感温度',
      value: tempValue,
      level: tempLevel,
      color: tempValue >= 28 ? 'bg-orange-500' : tempValue >= 22 ? 'bg-green-500' : 'bg-cyan-500',
    },
  ];
}

// 月間潮見表データ生成
export function generateMonthlyTideData(startDate: Date = new Date(), lat: number = 27.52, lng: number = 128.58): TideData[] {
  const data: TideData[] = [];
  
  for (let i = 0; i < 31; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    data.push(generateTideData(date, lat, lng));
  }
  
  return data;
}
