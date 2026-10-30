import type { WeatherSnap } from './types';

/**
 * Free, keyless weather from Open-Meteo. Optional — requires the user to allow
 * location once. Falls back to null so tracking never blocks on weather.
 */
export async function getWeatherSnapshot(): Promise<WeatherSnap | null> {
  try {
    if (!('geolocation' in navigator)) return null;
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 10 * 60 * 1000,
      });
    });
    const { latitude, longitude } = pos.coords;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}` +
      `&current=temperature_2m,relative_humidity_2m,surface_pressure` +
      `&hourly=surface_pressure&forecast_days=1`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const cur = json.current;
    if (!cur) return null;

    const pressure = Math.round(cur.surface_pressure);
    // pressure three hours ago (hourly is local time, current.time is the latest)
    const delta3h = computeDelta(json.hourly, pressure);

    return {
      tempC: Math.round(cur.temperature_2m),
      pressureHpa: pressure,
      humidity: Math.round(cur.relative_humidity_2m),
      delta3h,
      trend: trendOf(delta3h),
      trendLabel: trendLabel(delta3h),
      at: Date.now(),
    };
  } catch {
    return null;
  }
}

function computeDelta(hourly: { time?: string[]; surface_pressure?: number[] } | undefined, current: number): number {
  if (!hourly?.surface_pressure?.length) return 0;
  const times = hourly.time ?? [];
  const pressures = hourly.surface_pressure;
  // find the value closest to 3 hours before the last entry
  const last = times.length - 1;
  const target = new Date(times[last]).getTime() - 3 * 3600 * 1000;
  let best = pressures[0];
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const d = Math.abs(new Date(times[i]).getTime() - target);
    if (d < bestDiff) {
      bestDiff = d;
      best = pressures[i];
    }
  }
  return Math.round((current - best) * 10) / 10;
}

function trendOf(delta: number): WeatherSnap['trend'] {
  if (delta <= -2) return 'falling-fast';
  if (delta <= -0.6) return 'falling';
  if (delta >= 0.6) return 'rising';
  return 'steady';
}

export function trendLabel(delta: number): string {
  if (delta <= -2) return 'falling fast';
  if (delta <= -0.6) return 'falling';
  if (delta >= 0.6) return 'rising';
  return 'steady';
}

export function weatherAdvice(snap: WeatherSnap): string {
  switch (snap.trend) {
    case 'falling-fast':
    case 'falling':
      return 'Pressure is dropping — a heavier day. Plan lighter.';
    case 'rising':
      return 'Pressure is rising — usually easier going.';
    default:
      return 'Pressure is steady.';
  }
}
