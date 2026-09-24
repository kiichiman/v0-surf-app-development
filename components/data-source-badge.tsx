'use client';

import { Badge } from '@/components/ui/badge';
import { Database, Cloud, ExternalLink } from 'lucide-react';

export type DataSourceType = 'tide736' | 'jma' | 'simulation';

interface DataSourceBadgeProps {
  source: DataSourceType;
  showLink?: boolean;
  size?: 'sm' | 'md';
}

const sourceInfo: Record<DataSourceType, { name: string; url: string; icon: typeof Database }> = {
  tide736: {
    name: 'tide736.net',
    url: 'https://tide736.net/',
    icon: Database,
  },
  jma: {
    name: '気象庁',
    url: 'https://www.jma.go.jp/',
    icon: Cloud,
  },
  simulation: {
    name: 'シミュレーション',
    url: '',
    icon: Database,
  },
};

export function DataSourceBadge({ source, showLink = true, size = 'sm' }: DataSourceBadgeProps) {
  const info = sourceInfo[source];
  const Icon = info.icon;
  
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  
  if (showLink && info.url) {
    return (
      <a 
        href={info.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex"
      >
        <Badge 
          variant="outline" 
          className={`${sizeClasses} gap-1 hover:bg-secondary/50 transition-colors cursor-pointer`}
        >
          <Icon className={iconSize} />
          <span>{info.name}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </Badge>
      </a>
    );
  }
  
  return (
    <Badge variant="outline" className={`${sizeClasses} gap-1`}>
      <Icon className={iconSize} />
      <span>{info.name}</span>
    </Badge>
  );
}

interface DataSourceInfoProps {
  sources: { type: DataSourceType; label: string }[];
}

export function DataSourceInfo({ sources }: DataSourceInfoProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>データ提供:</span>
      {sources.map((source, index) => (
        <span key={source.type} className="flex items-center gap-1">
          <DataSourceBadge source={source.type} size="sm" />
          {source.label && <span className="text-[10px]">({source.label})</span>}
          {index < sources.length - 1 && <span className="text-muted-foreground/50">|</span>}
        </span>
      ))}
    </div>
  );
}
