// 徳之島の地域情報データ
// 座標は徳之島（鹿児島県大島郡：徳之島町・天城町・伊仙町）の主要スポット

export interface TokunoshimaSpot {
  name: string;
  category: 'beach' | 'surf' | 'fishing';
  description: string;
  lat: number;
  lng: number;
  town: string; // 所在地（町）
  features?: string[]; // 特徴タグ
}

export interface NearbyFacility {
  name: string;
  type: 'コンビニ' | 'スーパー' | '海鮮料理';
  town: string;
  description?: string;
  lat: number;
  lng: number;
}

// 海水浴場ポイント
export const beachSpots: TokunoshimaSpot[] = [
  {
    name: 'ヨナマビーチ（与名間海浜公園）',
    category: 'beach',
    description: '子宝空港から車で約10分。キャンプ場・プール・バンガローを備えたレジャースポット。遠浅で家族連れに人気。',
    lat: 27.836,
    lng: 128.881,
    town: '天城町',
    features: ['遠浅', 'キャンプ場', 'シャワー', '駐車場'],
  },
  {
    name: '畦プリンスビーチ',
    category: 'beach',
    description: '奄美群島国立公園に指定された約1.5km続く白い砂浜。波が穏やかな遠浅の海。皇太子ご成婚記念で命名。',
    lat: 27.748,
    lng: 129.012,
    town: '徳之島町',
    features: ['白砂', '遠浅', '国立公園', '夕日'],
  },
  {
    name: 'リクバマビーチ（里久浜）',
    category: 'beach',
    description: '里久浜海浜公園に隣接する海水浴場。サーフィンも楽しめる東部の浜。',
    lat: 27.790,
    lng: 129.020,
    town: '徳之島町',
    features: ['海水浴', 'サーフィン'],
  },
  {
    name: '喜念浜海水浴場',
    category: 'beach',
    description: '伊仙町南部の美しい砂浜。アダンの並木と白砂のコントラストが魅力。',
    lat: 27.677,
    lng: 128.968,
    town: '伊仙町',
    features: ['白砂', '景観', 'アダン並木'],
  },
  {
    name: '瀬田海海浜公園',
    category: 'beach',
    description: '天城町の海浜公園。広い芝生広場とビーチを併設し、海開きイベントの会場にもなる。',
    lat: 27.820,
    lng: 128.903,
    town: '天城町',
    features: ['芝生広場', '海水浴', 'イベント'],
  },
];

// サーフポイント
export const surfSpots: TokunoshimaSpot[] = [
  {
    name: '里久浜（リクバマ）',
    category: 'surf',
    description: '東部を代表するサーフポイント。リーフが多くリーフブーツ推奨。',
    lat: 27.790,
    lng: 129.020,
    town: '徳之島町',
    features: ['リーフ', '中級者向け'],
  },
  {
    name: '花徳浜（けどくはま）',
    category: 'surf',
    description: '北東部のサーフスポット。コンディションが揃うと良い波が立つ。',
    lat: 27.835,
    lng: 129.000,
    town: '徳之島町',
    features: ['リーフ', '北東うねり'],
  },
  {
    name: '金見崎エリア',
    category: 'surf',
    description: '島最北端・金見崎周辺。ソテツトンネルで有名なエリアで、うねりに反応するポイント。',
    lat: 27.870,
    lng: 129.012,
    town: '徳之島町',
    features: ['岬', '上級者向け'],
  },
];

// 釣り場ポイント
export const fishingSpots: TokunoshimaSpot[] = [
  {
    name: '亀徳港',
    category: 'fishing',
    description: '島の玄関口の港。サビキ釣りやエギングが楽しめる定番の釣り場。',
    lat: 27.740,
    lng: 129.013,
    town: '徳之島町',
    features: ['サビキ', 'エギング', '足場良好'],
  },
  {
    name: '平土野港',
    category: 'fishing',
    description: '西部の主要港。回遊魚やアオリイカが狙える。',
    lat: 27.823,
    lng: 128.886,
    town: '天城町',
    features: ['エギング', '回遊魚'],
  },
  {
    name: '犬田布岬',
    category: 'fishing',
    description: '伊仙町の景勝地。岩礁帯でイシガキダイや回遊魚をブッコミ釣りで狙う上級者向けポイント。',
    lat: 27.700,
    lng: 128.886,
    town: '伊仙町',
    features: ['磯釣り', 'イシガキダイ', '上級者向け'],
  },
  {
    name: '鹿浦港（ししうらこう）',
    category: 'fishing',
    description: '伊仙町南部の港。穏やかで家族でも楽しめる釣り場。',
    lat: 27.668,
    lng: 128.953,
    town: '伊仙町',
    features: ['サビキ', '初心者向け'],
  },
  {
    name: 'トンバラ岩',
    category: 'fishing',
    description: '犬田布岬沖の岩礁。大物回遊魚が狙えるダイビング＆フィッシングの名所。',
    lat: 27.690,
    lng: 128.870,
    town: '伊仙町',
    features: ['大物', '回遊魚', '渡船'],
  },
];

// 周辺施設（コンビニ・スーパー・海鮮料理）
export const nearbyFacilities: NearbyFacility[] = [
  // コンビニ
  {
    name: 'ファミリーマート 徳之島亀津店',
    type: 'コンビニ',
    town: '徳之島町亀津',
    description: '島内のファミリーマート。24時間営業。',
    lat: 27.722,
    lng: 129.011,
  },
  {
    name: 'ファミリーマート 天城浅間店',
    type: 'コンビニ',
    town: '天城町',
    description: '空港近くのファミリーマート。',
    lat: 27.832,
    lng: 128.882,
  },
  // スーパー
  {
    name: 'Aコープ 徳之島店',
    type: 'スーパー',
    town: '徳之島町亀津',
    description: '島内最大級の食品スーパー。生鮮・惣菜が充実。',
    lat: 27.720,
    lng: 129.008,
  },
  {
    name: 'ダイマルスーパー（義村商店）',
    type: 'スーパー',
    town: '徳之島町亀津',
    description: '亀津の地元密着型スーパー。日々の買い物に便利。',
    lat: 27.723,
    lng: 129.010,
  },
  // 海鮮料理
  {
    name: '海鮮居酒屋 漁火（いさりび）',
    type: '海鮮料理',
    town: '徳之島町亀津',
    description: '地元で揚がった新鮮な魚介を味わえる居酒屋。刺身盛りが名物。',
    lat: 27.723,
    lng: 129.012,
  },
];
