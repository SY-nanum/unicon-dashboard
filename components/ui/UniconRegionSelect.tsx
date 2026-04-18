'use client';

// UniconRegionSelect — blue region dropdown (Design System: ui_kits/dashboard/Card.jsx)

export const UNICON_REGIONS = [
  { id: 'KOR', label: '한국 (KOR)' },
  { id: 'USA', label: '미국 (USA)' },
  { id: 'CHN', label: '중국 (CHN)' },
  { id: 'JPN', label: '일본 (JPN)' },
  { id: 'EU',  label: 'EU+UK' },
];

interface UniconRegionSelectProps {
  value?: string;
  onChange?: (region: string) => void;
}

export function UniconRegionSelect({ value = 'KOR', onChange }: UniconRegionSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="shrink-0 cursor-pointer rounded-md border-2 border-blue-600 bg-blue-600 px-2.5 py-1 text-sm font-semibold text-white shadow-sm focus:outline-none"
    >
      {UNICON_REGIONS.map((r) => (
        <option key={r.id} value={r.id} className="bg-white text-slate-900">
          {r.label}
        </option>
      ))}
    </select>
  );
}
