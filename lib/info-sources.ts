// 徳之島・奄美・鹿児島の地域情報源リンク集
// 災害・警報・停電情報を最優先に掲載

export interface InfoSource {
  name: string;
  url: string;
  description: string;
}

export interface InfoSourceCategory {
  id: string;
  title: string;
  priority: boolean; // 優先表示（災害・警報・停電など）
  sources: InfoSource[];
}

export const infoSourceCategories: InfoSourceCategory[] = [
  {
    id: 'disaster',
    title: '防災・災害情報',
    priority: true,
    sources: [
      {
        name: '気象庁 防災情報',
        url: 'https://www.jma.go.jp/bosai/',
        description: '警報・注意報・台風・地震・津波情報',
      },
      {
        name: '気象庁 奄美地方の警報・注意報',
        url: 'https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=460100',
        description: '奄美地方に発表中の警報・注意報',
      },
      {
        name: '徳之島町 公式X（防災・お知らせ）',
        url: 'https://x.com/tokunoshima_t',
        description: '町からの防災・町政・緊急のお知らせ',
      },
      {
        name: '鹿児島県 防災ポータル',
        url: 'https://www.pref.kagoshima.jp/bosai/',
        description: '県内の防災情報・避難情報',
      },
      {
        name: 'NHK 鹿児島 災害・気象情報',
        url: 'https://www.nhk.or.jp/kagoshima/',
        description: 'NHK鹿児島の最新災害・気象ニュース',
      },
    ],
  },
  {
    id: 'power',
    title: '停電・ライフライン情報',
    priority: true,
    sources: [
      {
        name: '九州電力 停電情報',
        url: 'https://www.kyuden.co.jp/td_power_usages/pc.html',
        description: '九州電力エリアの停電発生・復旧状況',
      },
      {
        name: '九州電力送配電 公式',
        url: 'https://www.kyuden.co.jp/td_index.html',
        description: '送配電・停電に関する公式情報',
      },
      {
        name: '徳之島町 水道・ライフライン',
        url: 'https://www.tokunoshima-town.org/',
        description: '断水・水道工事などのお知らせ',
      },
    ],
  },
  {
    id: 'news',
    title: '地域ニュース',
    priority: false,
    sources: [
      {
        name: '奄美新聞（徳之島通信）',
        url: 'https://amamishimbun.co.jp/',
        description: '奄美群島の地域ニュース。徳之島通信カテゴリあり',
      },
      {
        name: '南海日日新聞',
        url: 'https://www.nankainn.com/',
        description: '奄美群島を対象とした地域ニュース',
      },
      {
        name: 'MBC 南日本放送',
        url: 'https://www.mbc.co.jp/news/',
        description: '鹿児島県の最新ニュース',
      },
      {
        name: 'KTS 鹿児島テレビ',
        url: 'https://www.kts-tv.co.jp/news/',
        description: '鹿児島県の最新ニュース',
      },
      {
        name: 'KKB 鹿児島放送',
        url: 'https://www.kkb.co.jp/news/',
        description: '鹿児島県の最新ニュース',
      },
    ],
  },
  {
    id: 'government',
    title: '行政・公式サイト',
    priority: false,
    sources: [
      {
        name: '徳之島町',
        url: 'https://www.tokunoshima-town.org/',
        description: '徳之島町の公式サイト',
      },
      {
        name: '天城町',
        url: 'https://www.town.amagi.lg.jp/',
        description: '天城町の公式サイト',
      },
      {
        name: '伊仙町',
        url: 'https://www.town.isen.kagoshima.jp/',
        description: '伊仙町の公式サイト',
      },
      {
        name: '奄美市',
        url: 'https://www.city.amami.lg.jp/',
        description: '奄美市の公式サイト',
      },
      {
        name: '鹿児島県',
        url: 'https://www.pref.kagoshima.jp/',
        description: '鹿児島県の公式サイト',
      },
    ],
  },
  {
    id: 'transport',
    title: '交通・運航情報',
    priority: false,
    sources: [
      {
        name: '徳之島子宝空港（JAL/JAC）',
        url: 'https://www.jal.co.jp/jp/ja/dom/status/',
        description: '航空便の運航状況・遅延・欠航情報',
      },
      {
        name: 'マルエーフェリー',
        url: 'https://www.aline-ferry.com/',
        description: '奄美・徳之島航路のフェリー運航情報',
      },
      {
        name: 'マリックスライン',
        url: 'https://www.marix-line.co.jp/',
        description: '鹿児島〜沖縄航路のフェリー運航情報',
      },
    ],
  },
];

// 更新スケジュール
export const updateSchedule = [
  { label: '朝', time: '6:00' },
  { label: '昼', time: '13:00' },
  { label: '夕方', time: '18:00' },
];
