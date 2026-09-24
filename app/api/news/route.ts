import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export const dynamic = 'force-dynamic';

// 取得するRSSフィード
const FEEDS = [
  { source: '奄美新聞', url: 'https://amamishimbun.co.jp/feed' },
  { source: '南海日日新聞', url: 'https://www.nankainn.com/feed' },
];

interface NewsItem {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  isLocal: boolean;
}

// 徳之島関連キーワード（優先表示用）
const TOKUNOSHIMA_KEYWORDS = [
  '徳之島', '天城町', '伊仙町', '亀津', '亀徳', '徳之島町',
  '犬田布', '花徳', '母間', '井之川', '山', '闘牛',
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function stripCdata(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim();
}

async function fetchFeed(source: string, url: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TideApp/1.0)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const data = parser.parse(xml);
    const items = data?.rss?.channel?.item ?? [];
    const list = Array.isArray(items) ? items : [items];

    return list.slice(0, 15).map((item: Record<string, unknown>): NewsItem => {
      const title = stripCdata(item.title);
      const link = stripCdata(item.link);
      const pubDate = typeof item.pubDate === 'string' ? item.pubDate : '';
      const isLocal = TOKUNOSHIMA_KEYWORDS.some((kw) => title.includes(kw));
      return { source, title, link, pubDate, isLocal };
    });
  } catch (e) {
    console.log('[v0] news feed fetch failed:', source, e);
    return [];
  }
}

export async function GET() {
  const results = await Promise.all(
    FEEDS.map((feed) => fetchFeed(feed.source, feed.url))
  );
  const allItems = results.flat();

  // 日付でソート（新しい順）
  allItems.sort((a, b) => {
    const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return dateB - dateA;
  });

  // 徳之島関連を優先で抽出
  const localNews = allItems.filter((item) => item.isLocal).slice(0, 8);
  const generalNews = allItems.filter((item) => !item.isLocal).slice(0, 10);

  return NextResponse.json({
    localNews,
    generalNews,
    updatedAt: new Date().toISOString(),
  });
}
