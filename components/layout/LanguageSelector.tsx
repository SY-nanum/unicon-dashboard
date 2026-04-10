'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LANG_OPTIONS, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

/** Inline SVG flags — compact 24×16 icons */
const FLAGS: Record<Lang, React.ReactNode> = {
  ko: (
    <svg viewBox="0 0 36 24" className="h-3 w-5" aria-label="한국어">
      <rect width="36" height="24" rx="2" fill="#fff"/>
      <circle cx="18" cy="12" r="6" fill="#C60C30"/>
      <path d="M18 6a6 6 0 0 1 0 12 3 3 0 0 1 0-6 3 3 0 0 0 0-6z" fill="#003478"/>
      <g stroke="#000" strokeWidth="0.8" fill="none">
        <line x1="26" y1="5" x2="30" y2="8"/>
        <line x1="27" y1="4" x2="31" y2="7"/>
        <line x1="6" y1="16" x2="10" y2="19"/>
        <line x1="5" y1="17" x2="9" y2="20"/>
        <line x1="26" y1="16" x2="30" y2="19"/>
        <line x1="27" y1="17" x2="31" y2="20"/>
        <line x1="5" y1="4" x2="9" y2="7"/>
        <line x1="6" y1="5" x2="10" y2="8"/>
      </g>
    </svg>
  ),
  en: (
    <svg viewBox="0 0 60 40" className="h-3 w-5" aria-label="English">
      {/* 13 stripes */}
      <rect width="60" height="40" fill="#fff"/>
      <rect y="0"  width="60" height="3.08" fill="#B22234"/>
      <rect y="6.15" width="60" height="3.08" fill="#B22234"/>
      <rect y="12.31" width="60" height="3.08" fill="#B22234"/>
      <rect y="18.46" width="60" height="3.08" fill="#B22234"/>
      <rect y="24.62" width="60" height="3.08" fill="#B22234"/>
      <rect y="30.77" width="60" height="3.08" fill="#B22234"/>
      <rect y="36.92" width="60" height="3.08" fill="#B22234"/>
      {/* Blue canton */}
      <rect width="24" height="21.54" fill="#3C3B6E"/>
      {/* Stars (simplified 3×3 grid) */}
      <g fill="#fff">
        <circle cx="4" cy="3.5" r="1.2"/><circle cx="12" cy="3.5" r="1.2"/><circle cx="20" cy="3.5" r="1.2"/>
        <circle cx="8" cy="7" r="1.2"/><circle cx="16" cy="7" r="1.2"/>
        <circle cx="4" cy="10.5" r="1.2"/><circle cx="12" cy="10.5" r="1.2"/><circle cx="20" cy="10.5" r="1.2"/>
        <circle cx="8" cy="14" r="1.2"/><circle cx="16" cy="14" r="1.2"/>
        <circle cx="4" cy="17.5" r="1.2"/><circle cx="12" cy="17.5" r="1.2"/><circle cx="20" cy="17.5" r="1.2"/>
      </g>
    </svg>
  ),
  zh: (
    <svg viewBox="0 0 36 24" className="h-3 w-5" aria-label="中文">
      <rect width="36" height="24" rx="2" fill="#DE2910"/>
      <g fill="#FFDE00">
        <polygon points="6,3 7.2,6.6 4,4.8 8,4.8 4.8,6.6" />
        <polygon points="11,1 11.5,2.4 10,1.7 12,1.7 10.5,2.4" />
        <polygon points="13,3 13.5,4.4 12,3.7 14,3.7 12.5,4.4" />
        <polygon points="13,6 13.5,7.4 12,6.7 14,6.7 12.5,7.4" />
        <polygon points="11,8 11.5,9.4 10,8.7 12,8.7 10.5,9.4" />
      </g>
    </svg>
  ),
  ja: (
    <svg viewBox="0 0 36 24" className="h-3 w-5" aria-label="日本語">
      <rect width="36" height="24" rx="2" fill="#fff"/>
      <circle cx="18" cy="12" r="6" fill="#BC002D"/>
    </svg>
  ),
};

export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get('lang') as Lang) || DEFAULT_LANG;

  function select(lang: Lang) {
    const params = new URLSearchParams(searchParams.toString());
    if (lang === DEFAULT_LANG) {
      params.delete('lang');
    } else {
      params.set('lang', lang);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="grid grid-cols-2 gap-1 justify-items-center">
      {LANG_OPTIONS.map((opt) => {
        const active = opt.code === current;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => select(opt.code)}
            title={opt.label}
            className={
              'flex h-6 w-7 items-center justify-center rounded border-2 transition ' +
              (active
                ? 'border-indigo-500'
                : 'border-transparent hover:border-slate-300')
            }
          >
            {FLAGS[opt.code]}
          </button>
        );
      })}
    </div>
  );
}
