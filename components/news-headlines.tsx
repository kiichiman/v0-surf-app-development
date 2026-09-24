'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNewsData, type NewsItem } from '@/hooks/use-api-data';
import { Newspaper, ExternalLink, MapPin, RefreshCw } from 'lucide-react';

function formatRelativeDate(pubDate: string): string {
  if (!pubDate) return '';
  const date = new Date(pubDate);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'たった今';
  if (diffHours < 24) return `${diffHours}時間前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}日前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed text-pretty">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-primary font-medium">{item.source}</span>
          {item.pubDate && (
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeDate(item.pubDate)}
            </span>
          )}
        </div>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

export function NewsHeadlines() {
  const { localNews, generalNews, isLoading, isError, refresh } = useNewsData();

  const hasNews = localNews.length > 0 || generalNews.length > 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            奄美・徳之島の最新ニュース
          </CardTitle>
          <button
            onClick={() => refresh()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="ニュースを更新"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            更新
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !hasNews && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            ニュースを読み込んでいます...
          </p>
        )}

        {isError && !hasNews && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            ニュースを取得できませんでした。各社の公式サイトをご確認ください。
          </p>
        )}

        {/* 徳之島関連ニュース */}
        {localNews.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-medium text-foreground">徳之島関連</h3>
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                注目
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {localNews.map((item) => (
                <NewsRow key={item.link} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* 奄美地域の一般ニュース */}
        {generalNews.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Newspaper className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">奄美地域のニュース</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {generalNews.map((item) => (
                <NewsRow key={item.link} item={item} />
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
          ※ 見出しは奄美新聞・南海日日新聞のRSS配信から取得しています。記事全文は各見出しをタップして出典元でご覧ください。
        </p>
      </CardContent>
    </Card>
  );
}
