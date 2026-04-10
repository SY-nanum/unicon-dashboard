'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { REGIONS, DEFAULT_REGION } from '@/lib/regions';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

export function RegionSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('region') || DEFAULT_REGION;
  const lang = (searchParams.get('lang') as Lang) || DEFAULT_LANG;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('region', e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="region-select" className="text-xs font-medium text-slate-500">
        {t('ui.region', lang)}
      </label>
      <select
        id="region-select"
        value={current}
        onChange={handleChange}
        className="rounded-md border-2 border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {REGIONS.map((r) => (
          <option key={r.code} value={r.code} className="bg-white text-slate-800">
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
