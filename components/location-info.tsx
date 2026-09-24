'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Star,
  Share2,
  Navigation,
  RefreshCw,
  Clock
} from 'lucide-react';

interface LocationInfoProps {
  name: string;
  region: string;
  lat: number;
  lng: number;
  lastUpdated?: Date;
}

export function LocationInfo({ name, region, lat, lng, lastUpdated }: LocationInfoProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };
  
  const formatDate = (date: Date) => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${dayNames[date.getDay()]}）`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          {/* 現在時刻表示 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">{formatDate(currentTime)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-semibold text-foreground tracking-wider">
                {formatTime(currentTime)}
              </span>
              {lastUpdated && (
                <Badge variant="outline" className="text-xs gap-1">
                  <RefreshCw className="w-3 h-3" />
                  更新: {formatTime(lastUpdated)}
                </Badge>
              )}
            </div>
          </div>
          
          {/* 地点情報 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl text-foreground">{name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{region}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  緯度: {lat.toFixed(2)} / 経度: {lng.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">お気に入り</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">シェア</span>
              </Button>
              <Button variant="default" size="sm" className="gap-1.5">
                <Navigation className="w-4 h-4" />
                <span className="hidden sm:inline">ナビ</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
