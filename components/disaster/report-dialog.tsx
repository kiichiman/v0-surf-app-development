'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ALL_BOUNDS,
  CATEGORY_LABELS,
  CARRIER_LABELS,
  checkReportRateLimit,
  getSupabase,
  recordReport,
  type Carrier,
  type Category,
} from '@/lib/disaster/core'

type Kind = 'sign' | 'onset'
type LatLng = { lat: number; lng: number }

const KIND_LABELS: Record<Kind, string> = {
  sign: '予兆（ちらつき）',
  onset: '障害発生',
}

const CATEGORY_ORDER: Category[] = ['power', 'water', 'comm']
const CARRIER_ORDER: Carrier[] = ['docomo', 'au', 'rakuten']

export type ReportDialogProps = {
  open: boolean
  onClose: () => void
  onSubmitted: (category: Category, carrier: Carrier | null) => void
}

export default function ReportDialog({ open, onClose, onSubmitted }: ReportDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [category, setCategory] = useState<Category>('power')
  const [carrier, setCarrier] = useState<Carrier | null>(null)
  const [kind, setKind] = useState<Kind>('onset')
  const [location, setLocation] = useState<LatLng | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const confirmTimerRef = useRef<number | null>(null)
  const locationRef = useRef<LatLng | null>(null)

  const clearConfirmTimer = useCallback(() => {
    if (confirmTimerRef.current !== null) {
      window.clearTimeout(confirmTimerRef.current)
      confirmTimerRef.current = null
    }
  }, [])

  const disposeMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }
    markerRef.current = null
  }, [])

  const setLocationBoth = useCallback((next: LatLng | null) => {
    locationRef.current = next
    setLocation(next)
  }, [])

  const placeMarker = useCallback((next: LatLng) => {
    const map = mapRef.current
    if (!map) return
    if (markerRef.current) {
      markerRef.current.setLatLng([next.lat, next.lng])
    } else {
      markerRef.current = L.circleMarker([next.lat, next.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#f59e0b',
        fillOpacity: 1,
      }).addTo(map)
    }
  }, [])

  useEffect(() => {
    locationRef.current = location
  }, [location])

  // 開くたびに初期化
  useEffect(() => {
    if (open) {
      setStep(1)
      setCategory('power')
      setCarrier(null)
      setKind('onset')
      setLocationBoth(null)
      setError(null)
      setNotice(null)
      setConfirming(false)
      setSubmitting(false)
      disposeMap()
    }
  }, [open, disposeMap, setLocationBoth])

  // 閉じたとき・アンマウント時にクリーンアップ
  useEffect(() => {
    if (!open) {
      clearConfirmTimer()
      disposeMap()
    }
  }, [open, clearConfirmTimer, disposeMap])

  useEffect(() => {
    return () => {
      clearConfirmTimer()
      disposeMap()
    }
  }, [clearConfirmTimer, disposeMap])

  // step2 表示時に地図を作成
  useEffect(() => {
    if (!open || step !== 2) {
      return
    }
    const container = mapContainerRef.current
    if (!container || mapRef.current) {
      return
    }

    const map = L.map(container)
    map.fitBounds(L.latLngBounds(ALL_BOUNDS))
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      const next = { lat: e.latlng.lat, lng: e.latlng.lng }
      setLocationBoth(next)
      placeMarker(next)
      setError(null)
    })

    mapRef.current = map

    const current = locationRef.current
    if (current) {
      placeMarker(current)
    }

    const invalidateTimer = window.setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 100)

    return () => {
      window.clearTimeout(invalidateTimer)
      disposeMap()
    }
  }, [open, step, disposeMap, placeMarker, setLocationBoth])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        clearConfirmTimer()
        disposeMap()
        onClose()
      }
    },
    [clearConfirmTimer, disposeMap, onClose],
  )

  const handleBack = useCallback(() => {
    clearConfirmTimer()
    setConfirming(false)
    setError(null)
    setNotice(null)
    disposeMap()
    setStep(1)
  }, [clearConfirmTimer, disposeMap])

  const handleNext = useCallback(() => {
    setError(null)
    if (category === 'comm' && !carrier) {
      setError('キャリアを選択してください。')
      return
    }
    setStep(2)
  }, [category, carrier])

  const handleGps = useCallback(() => {
    setError(null)
    if (!navigator.geolocation) {
      setNotice(null)
      setError('この端末は位置情報に対応していません。地図をタップで指定してください。')
      return
    }
    setNotice('現在地を取得中…')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude
        const lng = p.coords.longitude
        const next = { lat, lng }
        setNotice(null)
        setError(null)
        setLocationBoth(next)
        placeMarker(next)
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 14)
        }
      },
      (e) => {
        console.error(e)
        setNotice(null)
        setError(
          e.code === 1
            ? '位置情報が許可されていません。Safariのサイト設定で許可するか、地図をタップで指定してください。'
            : e.code === 2
              ? '現在地を取得できませんでした（電波やGPSの状態）。地図をタップで指定できます。'
              : e.code === 3
                ? '位置情報の取得がタイムアウトしました。もう一度押すか、地図をタップで指定してください。'
                : '現在地を取得できませんでした。地図をタップで指定できます。',
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [placeMarker, setLocationBoth])

  const handleSubmit = useCallback(async () => {
    const current = locationRef.current
    if (!current) {
      setError('地図をタップして場所を指定してください。')
      return
    }

    const key = category === 'comm' ? `comm:${carrier}` : category
    const now = Date.now()
    const limitMessage = checkReportRateLimit(now, key)
    if (limitMessage) {
      setConfirming(false)
      clearConfirmTimer()
      setError(limitMessage)
      return
    }

    if (!confirming) {
      setConfirming(true)
      setError(null)
      clearConfirmTimer()
      confirmTimerRef.current = window.setTimeout(() => {
        setConfirming(false)
        confirmTimerRef.current = null
      }, 5000)
      return
    }

    clearConfirmTimer()
    setConfirming(false)
    setSubmitting(true)
    setError(null)

    const t = new Date().toISOString()
    const record = {
      category,
      carrier: category === 'comm' ? carrier : null,
      lat: current.lat,
      lng: current.lng,
      sign_at: kind === 'sign' ? t : null,
      onset_at: kind === 'onset' ? t : null,
      created_at: t,
    }

    try {
      const supabase = getSupabase()
      if (supabase) {
        const { error: insertError } = await supabase.from('reports').insert(record)
        if (insertError) {
          throw insertError
        }
      }
      recordReport(key, now)
      setSubmitting(false)
      onSubmitted(category, category === 'comm' ? carrier : null)
    } catch (e) {
      console.error(e)
      setSubmitting(false)
      setError('通報の送信に失敗しました。')
    }
  }, [category, carrier, kind, confirming, clearConfirmTimer, onSubmitted])

  const stepLabel = step === 1 ? '災害通報（1/2）' : '災害通報（2/2）'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{stepLabel}</DialogTitle>
          {step === 1 ? (
            <DialogDescription>分野と状況を選択してください。</DialogDescription>
          ) : (
            <DialogDescription>現在地または地図をタップして場所を指定してください。</DialogDescription>
          )}
        </DialogHeader>

        {step === 1 ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">分野</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={category === value ? 'default' : 'outline'}
                    onClick={() => {
                      setCategory(value)
                      if (value !== 'comm') {
                        setCarrier(null)
                      }
                      setError(null)
                    }}
                  >
                    {CATEGORY_LABELS[value]}
                  </Button>
                ))}
              </div>
            </div>

            {category === 'comm' ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">キャリア</span>
                <div className="flex flex-wrap gap-2">
                  {CARRIER_ORDER.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={carrier === value ? 'default' : 'outline'}
                      onClick={() => {
                        setCarrier(value)
                        setError(null)
                      }}
                    >
                      {CARRIER_LABELS[value]}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">状況</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(KIND_LABELS) as Kind[]).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={kind === value ? 'default' : 'outline'}
                    onClick={() => {
                      setKind(value)
                      setError(null)
                    }}
                  >
                    {KIND_LABELS[value]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="secondary" onClick={handleGps}>
                現在地（GPS）
              </Button>
              <span className="text-sm text-muted-foreground">
                {location
                  ? `緯度 ${location.lat.toFixed(5)} / 経度 ${location.lng.toFixed(5)}`
                  : '場所未指定'}
              </span>
            </div>

            <div
              ref={mapContainerRef}
              className="h-[260px] w-full overflow-hidden rounded-md border border-border bg-secondary"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2">
          {step === 1 ? (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="button" onClick={handleNext}>
                次へ
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleBack}>
                戻る
              </Button>
              <Button type="button" disabled={submitting} onClick={handleSubmit}>
                {confirming ? '確認：もう一度押して送信' : '確認して送信'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
