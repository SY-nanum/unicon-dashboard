'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

function Inner() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') as Lang) || DEFAULT_LANG;
  return <>{t('header.title', lang)}</>;
}

export function HeaderTitle() {
  return (
    <Suspense fallback={t('header.title', DEFAULT_LANG)}>
      <Inner />
    </Suspense>
  );
}
