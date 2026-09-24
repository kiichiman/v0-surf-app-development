'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { infoSourceCategories, updateSchedule } from '@/lib/info-sources';
import {
  AlertTriangle,
  Zap,
  Newspaper,
  Building2,
  Plane,
  ExternalLink,
  Clock,
} from 'lucide-react';

const categoryIcons: Record<string, typeof AlertTriangle> = {
  disaster: AlertTriangle,
  power: Zap,
  news: Newspaper,
  government: Building2,
  transport: Plane,
};

export function InfoSources() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base md:text-lg text-foreground">
            地域情報リンク集
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>更新目安:</span>
            {updateSchedule.map((s, i) => (
              <span key={s.label}>
                {s.label} {s.time}
                {i < updateSchedule.length - 1 ? ' /' : ''}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {infoSourceCategories.map((category) => {
          const Icon = categoryIcons[category.id] || Newspaper;
          return (
            <div key={category.id}>
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  className={`w-4 h-4 ${
                    category.priority ? 'text-destructive' : 'text-primary'
                  }`}
                />
                <h3 className="text-sm font-medium text-foreground">
                  {category.title}
                </h3>
                {category.priority && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    優先
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.sources.map((source) => (
                  <a
                    key={source.name}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-start gap-2 p-2.5 rounded-lg border transition-colors ${
                      category.priority
                        ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                        : 'border-border bg-secondary/30 hover:bg-secondary/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {source.name}
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {source.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}

        <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
          ※ 各リンクは外部サイトに移動します。新聞記事は見出し・出典リンクのみを掲載しています。最新かつ正確な情報は各公式サイトをご確認ください。
        </p>
      </CardContent>
    </Card>
  );
}
