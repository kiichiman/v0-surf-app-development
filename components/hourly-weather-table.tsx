'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WeatherData } from '@/lib/tide-data';
import { 
  Sun, 
  Cloud, 
  CloudSun,
  Waves,
  Thermometer,
  AlertCircle
} from 'lucide-react';

interface HourlyWeatherTableProps {
  data: WeatherData[];
}

const getWeatherIcon = (weather: string) => {
  if (weather.includes('晴れ') && weather.includes('曇り')) {
    return <CloudSun className="w-5 h-5 text-yellow-400" />;
  }
  if (weather.includes('晴れ')) {
    return <Sun className="w-5 h-5 text-yellow-400" />;
  }
  return <Cloud className="w-5 h-5 text-gray-400" />;
};

const getWindArrow = (direction: string) => {
  const dirMap: Record<string, number> = {
    '北': 180,
    '北東': 225,
    '東': 270,
    '南東': 315,
    '南': 0,
    '南西': 45,
    '西': 90,
    '北西': 135,
  };
  const rotation = dirMap[direction] || 0;
  return (
    <span 
      className="inline-block text-primary"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      ↓
    </span>
  );
};

export function HourlyWeatherTable({ data }: HourlyWeatherTableProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            2時間毎の詳細予報
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1 text-yellow-500 border-yellow-500/50">
              <AlertCircle className="w-3 h-3" />
              シミュレーション
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          ※ 気温・気圧・海水温・波高等の詳細データは気象庁APIでは提供されていないため、参考値です
        </p>
      </CardHeader>
      <CardContent className="px-0 md:px-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground min-w-[60px]">時刻</TableHead>
              <TableHead className="text-muted-foreground min-w-[60px]">天気</TableHead>
              <TableHead className="text-muted-foreground min-w-[50px]">気温</TableHead>
              <TableHead className="text-muted-foreground min-w-[60px]">気圧</TableHead>
              <TableHead className="text-muted-foreground min-w-[60px]">海水温</TableHead>
              <TableHead className="text-muted-foreground min-w-[60px]">潮位</TableHead>
              <TableHead className="text-muted-foreground min-w-[80px]">風</TableHead>
              <TableHead className="text-muted-foreground min-w-[100px]">波</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 12).map((row, index) => (
              <TableRow key={index} className="border-border hover:bg-secondary/30">
                <TableCell className="font-medium text-foreground">{row.time}</TableCell>
                <TableCell>{getWeatherIcon(row.weather)}</TableCell>
                <TableCell className="text-foreground">{row.temperature}°C</TableCell>
                <TableCell className="text-muted-foreground text-sm">{row.pressure}</TableCell>
                <TableCell className="text-primary">{row.seaTemperature}°C</TableCell>
                <TableCell className="text-accent">{row.tideHeight}cm</TableCell>
                <TableCell className="text-foreground">
                  <div className="flex items-center gap-1">
                    {getWindArrow(row.windDirection)}
                    <span>{row.windSpeed}m/s</span>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
                  <div className="flex items-center gap-1">
                    <Waves className="w-4 h-4 text-primary" />
                    <span>{row.waveHeight}m / {row.wavePeriod}s</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
