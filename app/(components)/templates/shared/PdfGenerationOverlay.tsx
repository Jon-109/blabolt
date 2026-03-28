'use client';

type PdfGenerationOverlayProps = {
  templateLabel: string;
};

export default function PdfGenerationOverlay({ templateLabel }: PdfGenerationOverlayProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-white/95 p-8 text-center shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/25 border-t-white" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Generating your PDF</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We are preparing your {templateLabel} and saving it to your templates dashboard.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
          <p className="text-sm font-semibold text-slate-900">What happens next</p>
          <p className="mt-1 text-sm text-slate-600">
            Once the PDF finishes generating, you will be redirected to the templates dashboard where the completed card will show a
            <span className="mx-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[12px] font-semibold text-emerald-800">Download PDF</span>
            button.
          </p>
        </div>
      </div>
    </div>
  );
}
