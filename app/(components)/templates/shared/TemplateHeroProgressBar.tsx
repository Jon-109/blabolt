'use client';

type TemplateHeroProgressBarProps = {
  label: string;
  percent: number;
};

export default function TemplateHeroProgressBar({ label, percent }: TemplateHeroProgressBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));

  return (
    <section className="border-y border-sky-300/40 bg-gradient-to-r from-cyan-100/90 via-white to-emerald-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="truncate text-xs font-semibold text-slate-900 sm:text-sm">{label}</div>
            <div className="text-xs font-bold text-slate-900 sm:text-sm">{clampedPercent}%</div>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-300/70">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0284c7_0%,#14b8a6_50%,#16a34a_100%)] shadow-[0_0_12px_rgba(20,184,166,0.35)] transition-all duration-500 ease-out"
              style={{ width: `${clampedPercent}%` }}
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/35 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
