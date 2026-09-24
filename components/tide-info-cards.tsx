'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TideData } from '@/lib/tide-data';
import { Sunrise, Sunset, Moon, ArrowUp, ArrowDown } from 'lucide-react';
import { DataSourceBadge, type DataSourceType } from '@/components/data-source-badge';

interface TideInfoCardsProps {
  tideData: TideData;
  dataSource?: DataSourceType;
}

export function TideInfoCards({ tideData, dataSource = 'tide736' }: TideInfoCardsProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <DataSourceBadge source={dataSource} size="sm" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {/* 満潮情報 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
            <ArrowUp className="w-4 h-4 text-primary" />
            満潮
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {tideData.highTides && tideData.highTides.length > 0 ? (
            tideData.highTides.map((tide, i) => (
              <div key={i} className="flex justify-between items-center text-sm md:text-base">
                <span className="text-foreground font-medium">{tide.time}</span>
                <span className="text-primary font-bold">{Math.round(tide.height)}cm</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">データなし</p>
          )}
        </CardContent>
      </Card>

      {/* 干潮情報 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
            <ArrowDown className="w-4 h-4 text-accent" />
            干潮
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {tideData.lowTides && tideData.lowTides.length > 0 ? (
            tideData.lowTides.map((tide, i) => (
              <div key={i} className="flex justify-between items-center text-sm md:text-base">
                <span className="text-foreground font-medium">{tide.time}</span>
                <span className="text-accent font-bold">{Math.round(tide.height)}cm</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">データなし</p>
          )}
        </CardContent>
      </Card>

      {/* 日の出・日の入り */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
            <Sunrise className="w-4 h-4 text-yellow-500" />
            太陽
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1">
          <div className="flex justify-between items-center text-sm md:text-base">
            <span className="text-muted-foreground">出</span>
            <span className="text-foreground font-medium">{tideData.sunrise}</span>
          </div>
          <div className="flex justify-between items-center text-sm md:text-base">
            <span className="text-muted-foreground">入</span>
            <span className="text-foreground font-medium">{tideData.sunset}</span>
          </div>
        </CardContent>
      </Card>

      {/* 月の出・月の入り */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-blue-300" />
            月
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1">
          <div className="flex justify-between items-center text-sm md:text-base">
            <span className="text-muted-foreground">出</span>
            <span className="text-foreground font-medium">{tideData.moonrise}</span>
          </div>
          <div className="flex justify-between items-center text-sm md:text-base">
            <span className="text-muted-foreground">入</span>
            <span className="text-foreground font-medium">{tideData.moonset}</span>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
