import Link from 'next/link';
import { Waves, Mail, Facebook, Twitter, ExternalLink, Database, Cloud } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Waves className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg text-foreground">Surf Life</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              サーファー、釣り人、海事関係者のための潮見表・波情報・気象情報を提供しています。
            </p>
          </div>
          
          {/* Menu */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">メニュー</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="#tide" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  潮見表
                </Link>
              </li>
              <li>
                <Link href="#weather" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  天気予報
                </Link>
              </li>
              <li>
                <Link href="#map" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  周辺施設
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">サポート</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  よくある質問
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="#terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
            </ul>
          </div>
          
          {/* SNS & Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">フォロー</h3>
            <div className="flex items-center gap-3 mb-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-secondary/50 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-secondary/50 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="mailto:contact@surflife.jp" 
                className="p-2 bg-secondary/50 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Data Sources */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="bg-secondary/30 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              データ提供元
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-primary/10 rounded">
                  <Waves className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <a 
                    href="https://tide736.net/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    tide736.net
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    潮汐データ（満潮・干潮時刻、潮位、月齢、日の出・日の入り）
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-primary/10 rounded">
                  <Cloud className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <a 
                    href="https://www.jma.go.jp/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    気象庁
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    天気予報（週間天気、気温、降水確率、波高）
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-foreground mb-2">免責事項</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            本サイトの情報は参考目的で提供されており、航海用には使用できません。
            潮汐予測や気象情報は変動する可能性があります。
            実際の海況は現地で確認し、安全に十分注意してください。
            本サイトの情報を利用したことによる損害について、当サイトは一切の責任を負いません。
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Surf Life. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            潮汐: tide736.net | 天気: 気象庁
          </p>
        </div>
      </div>
    </footer>
  );
}
