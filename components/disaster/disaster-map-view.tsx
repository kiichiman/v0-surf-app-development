'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  ALL_BOUNDS,
  AREAS,
  CARRIER_COLORS,
  CARRIER_COLOR_FALLBACK,
  CARRIER_LABELS,
  CATEGORY_LABELS,
  STATE_COLORS,
  checkReportRateLimit,
  getSupabase,
  labelHtml,
  recordReport,
  sampleReports,
  stateAt,
  type Carrier,
  type Category,
  type Report,
  type ReportState,
} from '@/lib/disaster/core';

interface DisasterMapViewProps {
  active?: boolean;
  refreshKey?: number;
  onRequestReport?: () => void;
  focus?: { category: Category; carrier: Carrier | null; nonce: number };
}

const CATEGORIES: Category[] = ['power', 'water', 'comm'];
const CARRIERS: Carrier[] = ['docomo', 'au', 'rakuten'];

const toMs = (x: string | null): number | null => (x ? new Date(x).getTime() : null);

export default function DisasterMapView({ active, refreshKey, onRequestReport, focus }: DisasterMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const reportsRef = useRef<Report[]>([]);
  const categoryRef = useRef<Category>('power');
  const carrierRef = useRef<'' | Carrier>('');
  const viewTimeRef = useRef<number>(Date.now());
  const offlineSeededRef = useRef(false);
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [category, setCategory] = useState<Category>('power');
  const [carrier, setCarrier] = useState<'' | Carrier>('');
  const [viewTime, setViewTime] = useState<number>(Date.now());
  const [timeMin, setTimeMin] = useState<number>(Date.now() - 72 * 3600000);
  const [timeMax, setTimeMax] = useState<number>(Date.now());
  const [message, setMessage] = useState<string>('');
  const [messageVisible, setMessageVisible] = useState<boolean>(false);

  const showMessage = useCallback((text: string) => {
    setMessage(text);
    setMessageVisible(true);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => {
      setMessageVisible(false);
    }, 4500);
  }, []);

  const draw = useCallback(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;
    const cat = categoryRef.current;
    const selCarrier = carrierRef.current;
    const vt = viewTimeRef.current;
    layer.clearLayers();
    reportsRef.current
      .filter((r) => r.category === cat && (cat !== 'comm' || !selCarrier || r.carrier === selCarrier))
      .forEach((r) => {
        const s = stateAt(r, vt);
        if (!s) return;
        const color = STATE_COLORS[s];
        const carrierColor = r.carrier ? CARRIER_COLORS[r.carrier] : CARRIER_COLOR_FALLBACK;
        const icon = L.divIcon({
          className: s === 'warning' ? 'marker-warning' : '',
          html:
            r.category === 'comm'
              ? `<div style="width:26px;height:26px;border-radius:50%;background:${carrierColor};border:3px solid white;box-shadow:0 1px 5px #0008;display:flex;align-items:center;justify-content:center;box-sizing:border-box"><div style="width:14px;height:14px;border-radius:50%;background:${color}"></div></div>`
              : `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 1px 5px #0008"></div>`,
          iconSize: r.category === 'comm' ? [26, 26] : [18, 18],
          iconAnchor: r.category === 'comm' ? [13, 13] : [9, 9],
        });
        const m = L.marker([r.lat, r.lng], { icon }).addTo(layer);
        let html = `<b>${labelHtml(r, s, vt)}</b>`;
        if (s !== 'restored') html += `<br><button class="danger" data-recovery="${r.id}">復旧を報告</button>`;
        m.bindPopup(html);
      });
  }, []);

  const reportRecovery = useCallback(
    async (id: string) => {
      const now = Date.now();
      const rateMessage = checkReportRateLimit(now, '#recover');
      if (rateMessage) {
        showMessage(rateMessage);
        return;
      }
      const t = new Date().toISOString();
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { error } = await supabase.from('reports').update({ restored_at: t }).eq('id', id).is('restored_at', null);
          if (error) throw error;
        } else {
          const r = reportsRef.current.find((x) => x.id === id);
          if (r) r.restored_at = t;
        }
        recordReport('#recover', now);
        await reloadRef.current();
        showMessage('復旧報告を受け付けました。');
      } catch (e) {
        console.error(e);
        showMessage('復旧報告に失敗しました。');
      }
    },
    [showMessage]
  );

  const reloadRef = useRef<() => Promise<void>>(async () => {});

  const reload = useCallback(async () => {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase.from('reports').select('*');
        if (error) throw error;
        reportsRef.current = (data || []) as Report[];
      } else if (!offlineSeededRef.current) {
        reportsRef.current = sampleReports(Date.now());
        offlineSeededRef.current = true;
      }
      const now = Date.now();
      const starts = reportsRef.current
        .map((r) => toMs(r.onset_at ?? r.sign_at))
        .filter((v): v is number => v !== null);
      setTimeMin(starts.length ? Math.min(...starts) : now - 72 * 3600000);
      setTimeMax(now);
      viewTimeRef.current = now;
      setViewTime(now);
      draw();
    } catch (e) {
      console.error(e);
      showMessage('データ取得に失敗しました。');
    }
  }, [draw, showMessage]);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    if (!mapElRef.current) return;
    const map = L.map(mapElRef.current);
    map.fitBounds(ALL_BOUNDS);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markerLayerRef.current = layer;

    map.on('popupopen', (e) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;
      const btn = popupEl.querySelector<HTMLButtonElement>('button[data-recovery]');
      if (!btn) return;
      L.DomEvent.on(btn, 'click', (ev) => {
        L.DomEvent.stop(ev);
        const id = btn.getAttribute('data-recovery');
        if (id) reportRecovery(id);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, [reportRecovery]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel('reports-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        reloadRef.current();
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      getSupabase()?.removeChannel(channel);
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    categoryRef.current = category;
  }, [category]);

  useEffect(() => {
    carrierRef.current = carrier;
  }, [carrier]);

  useEffect(() => {
    viewTimeRef.current = viewTime;
  }, [viewTime]);

  useEffect(() => {
    reloadRef.current();
  }, [refreshKey]);

  useEffect(() => {
    draw();
  }, [category, carrier, viewTime, draw]);

  useEffect(() => {
    if (!focus || focus.nonce === undefined) return;
    setCategory(focus.category);
    setCarrier(focus.carrier ?? '');
    showMessage('通報を受け付けました。');
  }, [focus?.nonce, showMessage]);

  useEffect(() => {
    if (!active) return;
    if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
    invalidateTimerRef.current = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
    return () => {
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
    };
  }, [active]);

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
    };
  }, []);

  const handleCategory = (c: Category) => {
    setCategory(c);
  };

  const handleArea = (areaId: string | null) => {
    const map = mapRef.current;
    if (!map) return;
    if (areaId === null) {
      map.fitBounds(ALL_BOUNDS);
      return;
    }
    const area = AREAS.find((a) => a.id === areaId);
    if (area) map.fitBounds(area.bounds);
  };

  const displayedTime = new Date(viewTime).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="w-full">
      <style>{`@keyframes blink{50%{opacity:.25}}.marker-warning{animation:blink 1.2s infinite}.leaflet-popup-content button.danger{margin-top:6px;background:#dc2626;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer}`}</style>

      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">災害通報マップ</h2>
          <p className="text-xs text-muted-foreground">奄美大島・徳之島</p>
        </div>
        <button
          type="button"
          onClick={() => onRequestReport?.()}
          className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold px-4 py-2 rounded shadow"
        >
          通報する
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handleCategory(c)}
            className={
              category === c
                ? 'px-3 py-1 rounded text-sm font-bold bg-primary text-primary-foreground'
                : 'px-3 py-1 rounded text-sm bg-secondary text-secondary-foreground'
            }
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
        {category === 'comm' && (
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as '' | Carrier)}
            className="ml-1 border border-border rounded px-2 py-1 text-sm bg-background text-foreground"
          >
            <option value="">すべて</option>
            {CARRIERS.map((c) => (
              <option key={c} value={c}>
                {CARRIER_LABELS[c]}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => handleArea(null)}
          className="px-3 py-1 rounded text-sm bg-secondary text-secondary-foreground"
        >
          全体
        </button>
        {AREAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => handleArea(a.id)}
            className="px-3 py-1 rounded text-sm bg-secondary text-secondary-foreground"
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">過去</span>
        <input
          type="range"
          min={timeMin}
          max={timeMax}
          value={viewTime}
          onChange={(e) => setViewTime(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground">現在</span>
        <span className="text-xs text-foreground whitespace-nowrap">{displayedTime}</span>
      </div>

      <div className="relative">
        <div ref={mapElRef} style={{ height: '60vh', minHeight: '350px', width: '100%' }} className="rounded" />
        <div className="absolute left-2 bottom-2 z-[1000] bg-white/90 rounded shadow p-2 text-xs text-gray-800">
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: STATE_COLORS.warning }}
            />
            <span>予兆</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: STATE_COLORS.active }}
            />
            <span>障害中</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: STATE_COLORS.restored }}
            />
            <span>復旧</span>
          </div>
          <hr className="my-1 border-gray-300" />
          <div className="mb-1">通信キャリア（外側リング）</div>
          {CARRIERS.map((c) => (
            <div key={c} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: CARRIER_COLORS[c], border: '2px solid white' }}
              />
              <span>{CARRIER_LABELS[c]}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        ※本マップは投稿情報を表示するもので、正確性や安全を保証するものではありません。緊急時は公式情報を確認してください。
      </p>

      {messageVisible && (
        <div className="fixed right-4 bottom-4 z-[2000] bg-black text-white text-sm px-4 py-2 rounded shadow">
          {message}
        </div>
      )}
    </div>
  );
}
