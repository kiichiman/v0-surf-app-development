'use client';

interface MoonPhaseProps {
  phase: number; // 0-1 (0 = new moon, 0.5 = full moon, 1 = new moon)
  size?: number;
  moonAge: number;
  brightness?: number; // 輝面比 0-100%（APIから取得）
}

export function MoonPhase({ phase, size = 80, moonAge, brightness }: MoonPhaseProps) {
  // 月の満ち欠けをSVGで描画
  // moonAge: 0 = 新月, 7.5 = 上弦, 15 = 満月, 22.5 = 下弦, 29.5 = 新月
  
  // 月齢から月相を計算（より正確）
  const getMoonPhaseFromAge = (age: number): { illumination: number; isWaxing: boolean } => {
    const normalizedAge = age % 29.53;
    
    // 月齢15で満月（illumination = 100%）
    // 月齢0または29.53で新月（illumination = 0%）
    if (normalizedAge <= 14.765) {
      // 新月から満月（上弦）- illuminationが増加
      const illumination = (normalizedAge / 14.765) * 100;
      return { illumination, isWaxing: true };
    } else {
      // 満月から新月（下弦）- illuminationが減少
      const illumination = ((29.53 - normalizedAge) / 14.765) * 100;
      return { illumination, isWaxing: false };
    }
  };

  const { illumination: calculatedIllumination, isWaxing } = getMoonPhaseFromAge(
    typeof moonAge === 'number' ? moonAge : parseFloat(String(moonAge)) || 0
  );
  
  // 輝面比が提供されていればそれを使用、なければ計算値を使用
  const illumination = brightness !== undefined ? brightness : calculatedIllumination;
  
  const getMoonPath = () => {
    const radius = size / 2 - 2;
    const centerX = size / 2;
    const centerY = size / 2;
    
    if (illumination < 1) {
      // 新月 - 完全に暗い
      return null;
    }
    
    if (illumination > 98) {
      // 満月 - 完全に明るい円
      return `M ${centerX - radius} ${centerY} 
              A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY}
              A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY}`;
    }
    
    // 月の満ち欠けの計算
    // illumination: 0% = 新月, 50% = 半月, 100% = 満月
    const illuminationRatio = illumination / 100;
    
    // 終端線（ターミネーター）の横半径
    // 0%/100%付近: radius、50%: 0（直線）
    const curveRadiusX = Math.abs(1 - illuminationRatio * 2) * radius;
    // 50%超は外側に膨らむ（gibbous）、50%未満は内側に凹む（crescent）
    const isGibbous = illuminationRatio > 0.5;
    
    if (isWaxing) {
      // 上弦（右側が明るくなる）
      // 右半分の外周円弧を描画し、ターミネーターで閉じる
      // gibbous: 左に膨らむ(sweep1) / crescent: 右に膨らむ(sweep0)
      return `M ${centerX} ${centerY - radius}
              A ${radius} ${radius} 0 0 1 ${centerX} ${centerY + radius}
              A ${curveRadiusX} ${radius} 0 0 ${isGibbous ? 1 : 0} ${centerX} ${centerY - radius}`;
    } else {
      // 下弦（左側が明るい）
      // 左半分の外周円弧を描画し、ターミネーターで閉じる
      // gibbous: 右に膨らむ(sweep0) / crescent: 左に膨らむ(sweep1)
      return `M ${centerX} ${centerY - radius}
              A ${radius} ${radius} 0 0 0 ${centerX} ${centerY + radius}
              A ${curveRadiusX} ${radius} 0 0 ${isGibbous ? 0 : 1} ${centerX} ${centerY - radius}`;
    }
  };

  const getMoonPhaseName = () => {
    const age = typeof moonAge === 'number' ? moonAge : parseFloat(String(moonAge)) || 0;
    const normalizedAge = age % 29.53;
    
    if (normalizedAge < 1.5) return '新月';
    if (normalizedAge < 7) return '三日月';
    if (normalizedAge < 9) return '上弦';
    if (normalizedAge < 14) return '十三夜';
    if (normalizedAge < 16) return '満月';
    if (normalizedAge < 21) return '十八夜';
    if (normalizedAge < 24) return '下弦';
    if (normalizedAge < 28) return '二十六夜';
    return '新月';
  };

  const path = getMoonPath();

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* 月の背景（暗い部分） */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 2}
            fill="#1a1f2e"
            stroke="#3b4a6b"
            strokeWidth="1"
          />
          
          {/* 月の明るい部分 */}
          {path && (
            <path
              d={path}
              fill="#fef3c7"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(254, 243, 199, 0.5))',
              }}
            />
          )}
          
          {/* 月のクレーター模様（明るい部分にのみ表示） */}
          {path && illumination > 20 && (
            <>
              <circle cx={size * 0.4} cy={size * 0.35} r={size * 0.05} fill="#e5dcc3" opacity="0.4" />
              <circle cx={size * 0.55} cy={size * 0.5} r={size * 0.07} fill="#e5dcc3" opacity="0.3" />
              <circle cx={size * 0.42} cy={size * 0.62} r={size * 0.04} fill="#e5dcc3" opacity="0.35" />
            </>
          )}
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{getMoonPhaseName()}</p>
        <p className="text-xs text-muted-foreground">
          月齢 {typeof moonAge === 'number' ? moonAge.toFixed(1) : moonAge}
          {brightness !== undefined && ` (${brightness.toFixed(0)}%)`}
        </p>
      </div>
    </div>
  );
}
