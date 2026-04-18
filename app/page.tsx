import Link from 'next/link';
import { SECTORS, SECTOR_COLOR_CLASSES } from '@/lib/sectors';
import { sectorName, chartTitle, t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const lang = (langParam as Lang) || DEFAULT_LANG;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 text-center">{t('home.title', lang)}</h2>
        <p className="mt-1 text-sm text-slate-500 text-center">
          {t('home.subtitle', lang)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTORS.map((s) => {
          const c = SECTOR_COLOR_CLASSES[s.color];
          const firstChart = s.charts[0];
          const qs = lang !== DEFAULT_LANG ? `?lang=${lang}` : '';
          return (
            <Link
              key={s.slug}
              href={`/${s.slug}/${firstChart.slug}${qs}`}
              className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-block h-3 w-3 rounded-full ${c.dot}`} />
                <h3 className={`text-lg font-semibold ${c.accent}`}>{sectorName(s.slug, lang)}</h3>
                <span className="ml-auto text-xs text-slate-400">
                  {s.charts.filter((ch) => ch.implemented).length}/{s.charts.length}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {s.charts.map((chart, i) => (
                  <li key={chart.slug} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                      {i + 1}
                    </span>
                    <span className={chart.implemented ? 'text-slate-900' : 'text-slate-400'}>
                      {chartTitle(chart.slug, lang).replace('\n', ' ')}
                      {chart.implemented && (
                        <span className="ml-1 text-[10px] font-medium text-green-600">●</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
