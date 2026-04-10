import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { HeaderTitle } from '@/components/layout/HeaderTitle';

export const metadata: Metadata = {
  title: 'UNICON Dashboard',
  description: 'UNICON Integrated Assessment Model Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <header className="bg-indigo-900">
          <div className="px-6 py-3">
            <Link href="/" className="text-base font-semibold text-white hover:text-indigo-200">
              UNICON <span className="text-indigo-400">|</span> <HeaderTitle />
            </Link>
          </div>
        </header>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
