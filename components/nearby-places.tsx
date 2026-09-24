'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Store,
  ShoppingCart,
  Fish,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { nearbyFacilities, type NearbyFacility } from '@/lib/tokunoshima-spots';

type FacilityType = NearbyFacility['type'];

const typeConfig: Record<
  FacilityType,
  { icon: typeof Store; color: string }
> = {
  コンビニ: { icon: Store, color: 'text-sky-500' },
  スーパー: { icon: ShoppingCart, color: 'text-emerald-500' },
  海鮮料理: { icon: Fish, color: 'text-orange-500' },
};

const filterOptions: (FacilityType | 'すべて')[] = ['すべて', 'コンビニ', 'スーパー', '海鮮料理'];

export function NearbyPlaces() {
  const [filter, setFilter] = useState<FacilityType | 'すべて'>('すべて');

  const filtered =
    filter === 'すべて'
      ? nearbyFacilities
      : nearbyFacilities.filter((f) => f.type === filter);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          徳之島の周辺施設
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* フィルター */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.map((option) => (
            <Button
              key={option}
              variant={filter === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(option)}
            >
              {option}
            </Button>
          ))}
        </div>

        {/* 施設リスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map((place, index) => {
            const config = typeConfig[place.type];
            const Icon = config.icon;
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
            return (
              <div
                key={`${place.name}-${index}`}
                className="flex items-start justify-between gap-2 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 bg-muted rounded-lg ${config.color} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm text-balance">{place.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{place.type}</Badge>
                      <span className="text-xs text-muted-foreground">{place.town}</span>
                    </div>
                    {place.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {place.description}
                      </p>
                    )}
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      地図で見る
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
