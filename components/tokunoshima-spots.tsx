'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Waves, Wind, Fish, MapPin, ExternalLink } from 'lucide-react';
import {
  beachSpots,
  surfSpots,
  fishingSpots,
  type TokunoshimaSpot,
} from '@/lib/tokunoshima-spots';

// 徳之島の中心座標
const TOKUNOSHIMA_CENTER: [number, number] = [27.77, 128.95];

// SSRを無効化してマップを読み込む（Leafletはwindowに依存するため）
const SpotMap = dynamic(() => import('@/components/spot-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted">
      <p className="text-sm text-muted-foreground">地図を読み込み中...</p>
    </div>
  ),
});

type Category = 'beach' | 'surf' | 'fishing';

const tabConfig: Record<
  Category,
  { label: string; icon: typeof Waves; spots: TokunoshimaSpot[]; accent: string }
> = {
  beach: { label: '海水浴場', icon: Waves, spots: beachSpots, accent: 'text-sky-500' },
  surf: { label: 'サーフ', icon: Wind, spots: surfSpots, accent: 'text-orange-500' },
  fishing: { label: '釣り場', icon: Fish, spots: fishingSpots, accent: 'text-emerald-500' },
};

export function TokunoshimaSpots() {
  const [activeTab, setActiveTab] = useState<Category>('beach');
  const currentSpots = tabConfig[activeTab].spots;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-primary" />
          徳之島 海のスポットマップ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Category)}>
          <TabsList className="grid w-full grid-cols-3">
            {(Object.keys(tabConfig) as Category[]).map((key) => {
              const { label, icon: Icon } = tabConfig[key];
              return (
                <TabsTrigger key={key} value={key} className="gap-1.5">
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(tabConfig) as Category[]).map((key) => (
            <TabsContent key={key} value={key} className="mt-4">
              {/* 地図 */}
              <div className="h-72 w-full rounded-lg overflow-hidden border border-border mb-4">
                <SpotMap spots={tabConfig[key].spots} center={TOKUNOSHIMA_CENTER} />
              </div>

              {/* スポット一覧 */}
              <div className="grid gap-3 sm:grid-cols-2">
                {tabConfig[key].spots.map((spot, index) => (
                  <div
                    key={`${spot.name}-${index}`}
                    className="rounded-lg border border-border p-3 bg-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm text-foreground text-balance">
                        {spot.name}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {spot.town}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {spot.description}
                    </p>
                    {spot.features && spot.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {spot.features.map((f) => (
                          <span
                            key={f}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      地図で見る
                    </a>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
