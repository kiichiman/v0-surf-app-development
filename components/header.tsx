'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Home, 
  Waves, 
  Cloud,
  Calendar,
  Map,
  MapPin,
  Newspaper,
  Building2,
  Star,
  User,
  ChevronDown,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { APP_NAME } from '@/lib/app-config';

const navigation = [
  { name: 'ホーム', href: '/', icon: Home },
  { name: '潮見表', href: '#tide', icon: Waves },
  { name: '波情報', href: '#weather', icon: Waves },
  { name: '天気予報', href: '#weather', icon: Cloud },
  { name: 'カレンダー', href: '#calendar', icon: Calendar },
  { name: 'スポット', href: '#spots', icon: MapPin },
  { name: '周辺施設', href: '#map', icon: Map },
  { name: 'ニュース', href: '#news', icon: Newspaper },
  { name: '情報', href: '#info', icon: Building2 },
  { name: '災害マップ', href: '#disaster', icon: AlertTriangle },
];

export function Header({ onNavigate }: { onNavigate?: (hash: string) => void } = {}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate('/');
            }
          }}
          className="flex items-center gap-2"
        >
          <Waves className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          <span className="font-bold text-lg md:text-xl text-foreground">{APP_NAME}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if ((item.href.startsWith('#') || item.href === '/') && onNavigate) {
                  e.preventDefault();
                  onNavigate(item.href);
                }
              }}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <HelpCircle className="w-4 h-4 mr-1" />
            FAQ
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Star className="w-4 h-4 mr-1" />
            お気に入り
          </Button>
          <Button variant="default" size="sm">
            <User className="w-4 h-4 mr-1" />
            ログイン
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="w-5 h-5" />
              <span className="sr-only">メニューを開く</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-background border-border">
            <SheetHeader>
              <SheetTitle className="text-foreground flex items-center gap-2">
                <Waves className="w-5 h-5 text-primary" />
                {APP_NAME}
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    setIsOpen(false);
                    if ((item.href.startsWith('#') || item.href === '/') && onNavigate) {
                      e.preventDefault();
                      onNavigate(item.href);
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  {item.name}
                </Link>
              ))}
              <hr className="my-2 border-border" />
              <Link
                href="#faq"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-secondary/50 rounded-md transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                よくある質問
              </Link>
              <Link
                href="#favorites"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-secondary/50 rounded-md transition-colors"
              >
                <Star className="w-5 h-5 text-muted-foreground" />
                お気に入り
              </Link>
              <hr className="my-2 border-border" />
              <Button className="w-full mt-2">
                <User className="w-4 h-4 mr-2" />
                ログイン
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
