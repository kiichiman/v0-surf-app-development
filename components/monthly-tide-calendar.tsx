'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TideData } from '@/lib/tide-data';
import { DataSourceBadge } from '@/components/data-source-badge';

interface MonthlyTideCalendarProps {
  tideDataList: TideData[];
}

const getDayColor = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  if (day === 0) return 'text-red-400';
  if (day === 6) return 'text-blue-400';
  return 'text-foreground';
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]})`;
};

const getTideColor = (tideName: string) => {
  switch (tideName) {
    case '大潮':
      return 'bg-primary/20 text-primary';
    case '中潮':
      return 'bg-accent/20 text-accent';
    case '小潮':
      return 'bg-muted text-muted-foreground';
    case '長潮':
      return 'bg-yellow-500/20 text-yellow-500';
    case '若潮':
      return 'bg-green-500/20 text-green-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function MonthlyTideCalendar({ tideDataList }: MonthlyTideCalendarProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg text-foreground">月間潮見表</CardTitle>
          <DataSourceBadge source="tide736" size="sm" />
        </div>
      </CardHeader>
      <CardContent className="px-0 md:px-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground w-[80px]">日付</TableHead>
              <TableHead className="text-muted-foreground w-[60px]">潮回り</TableHead>
              <TableHead className="text-muted-foreground w-[50px]">月齢</TableHead>
              <TableHead className="text-muted-foreground">満潮</TableHead>
              <TableHead className="text-muted-foreground">干潮</TableHead>
              <TableHead className="text-muted-foreground w-[70px]">日出</TableHead>
              <TableHead className="text-muted-foreground w-[70px]">日入</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tideDataList.slice(0, 14).map((tide, index) => {
              const date = tide.date;
              return (
                <TableRow 
                  key={index} 
                  className={`border-border hover:bg-secondary/30 ${
                    index === 0 ? 'bg-primary/5' : ''
                  }`}
                >
                  <TableCell className="font-medium">
                    <span className={getDayColor(date)}>
                      {formatDate(date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTideColor(tide.tideName)}`}>
                      {tide.tideName}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {typeof tide.moonAge === 'number' ? tide.moonAge.toFixed(1) : tide.moonAge}
                  </TableCell>
                  <TableCell className="text-foreground text-sm">
                    {tide.highTides.map((t, i) => (
                      <span key={i}>
                        {t.time} <span className="text-primary">({Math.round(t.height)}cm)</span>
                        {i < tide.highTides.length - 1 && ' / '}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="text-foreground text-sm">
                    {tide.lowTides.map((t, i) => (
                      <span key={i}>
                        {t.time} <span className="text-accent">({Math.round(t.height)}cm)</span>
                        {i < tide.lowTides.length - 1 && ' / '}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{tide.sunrise}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{tide.sunset}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
