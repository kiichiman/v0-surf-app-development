'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeatherIndex } from '@/lib/tide-data';
import { Sun, Thermometer, Umbrella, Wind } from 'lucide-react';

interface WeatherIndicesProps {
  indices: WeatherIndex[];
}

const iconMap: Record<string, React.ReactNode> = {
  '紫外線': <Sun className="w-5 h-5 text-orange-400" />,
  '熱中症': <Thermometer className="w-5 h-5 text-red-400" />,
  '傘指数': <Umbrella className="w-5 h-5 text-blue-400" />,
  '体感温度': <Wind className="w-5 h-5 text-green-400" />,
};

const getProgressColor = (name: string): string => {
  switch (name) {
    case '紫外線':
      return 'bg-orange-500';
    case '熱中症':
      return 'bg-red-500';
    case '傘指数':
      return 'bg-blue-500';
    case '体感温度':
      return 'bg-green-500';
    default:
      return 'bg-primary';
  }
};

export function WeatherIndices({ indices }: WeatherIndicesProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg text-foreground">気象指数</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {indices.map((index) => (
            <div key={index.name} className="space-y-2">
              <div className="flex items-center gap-2">
                {iconMap[index.name]}
                <span className="text-sm text-muted-foreground">{index.name}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {index.name === '体感温度' ? `${index.value}°` : index.value}
                </span>
                <span className="text-xs text-muted-foreground">{index.level}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(index.name)} rounded-full transition-all`}
                  style={{ width: `${Math.min(index.value * 10, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
