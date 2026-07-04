import SafeImage from './SafeImage';
import { braveWeather } from '../lib/brave';

const toF = (c: number) => Math.round((c * 9) / 5 + 32);

/** Google-style weather card, streamed in via <Suspense>. */
export default async function WeatherCard({ callbackKey }: { callbackKey: string }) {
  const w = await braveWeather(callbackKey);
  if (!w) return null;

  return (
    <section className="mb-6 max-w-[652px] rounded-xl border border-line p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted">{w.location}</div>
          <div className="mt-1 flex items-center gap-1">
            <SafeImage
              src={w.icon}
              alt=""
              className="h-16 w-16"
              fallbackClassName="hidden"
            />
            <span className="text-5xl text-ink">{Math.round(w.tempC)}°</span>
            <span className="pt-4 text-sm text-muted">
              C · {toF(w.tempC)}°F
            </span>
          </div>
          {w.description && (
            <div className="mt-1 text-sm capitalize text-rurl">{w.description}</div>
          )}
        </div>
        <div className="pt-1 text-right text-sm leading-6 text-muted">
          {w.humidity !== undefined && <div>Humidity: {w.humidity}%</div>}
          {w.windKmh !== undefined && <div>Wind: {w.windKmh} km/h</div>}
          <div>Feels like {Math.round(w.feelsLikeC)}°</div>
        </div>
      </div>
      {w.daily.length > 0 && (
        <div className="mt-4 flex gap-1 overflow-x-auto border-t border-line pt-3">
          {w.daily.map((d, i) => (
            <div
              key={`${d.day}-${i}`}
              className="flex w-16 shrink-0 flex-col items-center text-sm"
            >
              <span className="text-muted">{d.day}</span>
              <SafeImage
                src={d.icon}
                alt=""
                className="h-10 w-10"
                fallbackClassName="block h-10 w-10"
              />
              <span className="text-ink">{Math.round(d.maxC)}°</span>
              <span className="text-muted">{Math.round(d.minC)}°</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 text-[11px] text-muted">
        Weather data by OpenWeatherMap
      </div>
    </section>
  );
}

export function WeatherSkeleton() {
  return (
    <div className="mb-6 max-w-[652px] animate-pulse rounded-xl border border-line p-4">
      <div className="mb-3 h-4 w-40 rounded bg-chiphover" />
      <div className="mb-2 h-12 w-32 rounded bg-chiphover" />
      <div className="h-4 w-24 rounded bg-chiphover" />
    </div>
  );
}
