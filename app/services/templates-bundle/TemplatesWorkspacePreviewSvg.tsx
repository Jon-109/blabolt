import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleCheck, UserRound } from 'lucide-react';

type PreviewTemplateCard = {
  description: string;
  highlightContinue?: boolean;
  periodHint?: string;
  progress: number;
  time: string;
  title: string;
};

const businessCards: PreviewTemplateCard[] = [
  {
    description:
      'Organizes every business debt payment in one schedule, so lenders can quickly assess total debt burden and monthly obligations.',
    progress: 94,
    time: '8-12 min',
    title: 'Business Debt Summary',
  },
  {
    description:
      'Shows what the business owns and owes as of one date, so lenders can quickly judge financial strength and leverage.',
    highlightContinue: true,
    periodHint: 'As of 12/31/2025',
    progress: 72,
    time: '5-10 min',
    title: '2026 YTD Balance Sheet',
  },
  {
    description:
      'Shows revenue, expenses, and profit for a period, so lenders can evaluate cash generation and repayment capacity.',
    periodHint: '01/01/2025 to 12/31/2025',
    progress: 51,
    time: '8-12 min',
    title: '2025 Income Statement',
  },
];

const personalCards: PreviewTemplateCard[] = [
  {
    description:
      'Summarizes personal debt balances and payments, so lenders can evaluate guarantor obligations and repayment pressure.',
    progress: 86,
    time: '5-8 min',
    title: 'Personal Debt Summary',
  },
  {
    description:
      'Provides a full guarantor net-worth snapshot of assets, liabilities, and income, which lenders use to evaluate personal strength and support.',
    progress: 67,
    time: '10-15 min',
    title: 'Personal Financial Statement',
  },
];

function mapProgressLabel(progress: number): string {
  if (progress >= 100) return 'Completed';
  if (progress >= 60) return 'In Progress';
  if (progress > 0) return 'Started';
  return 'Not Started';
}

function PreviewTemplateCardBlock({
  description,
  highlightContinue = false,
  periodHint,
  progress,
  time,
  title,
}: PreviewTemplateCard) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition-colors hover:border-blue-300 hover:bg-white">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        </div>
        <span className="text-[11px] font-medium text-slate-500">{time}</span>
      </div>

      <p className="mt-1 text-xs leading-4.5 text-slate-600">{description}</p>
      {periodHint ? <p className="mt-0.5 text-[11px] text-slate-500">{periodHint}</p> : null}

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-600">{progress}% complete</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          {mapProgressLabel(progress)}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <div
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
            highlightContinue
              ? 'border-cyan-300 bg-cyan-50 text-cyan-900 shadow-[0_0_0_3px_rgba(34,211,238,0.18)]'
              : 'border-slate-300 text-slate-800'
          }`}
        >
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
          Add Another
        </div>
      </div>
    </div>
  );
}

function MousePointer() {
  return (
    <svg aria-hidden="true" className="h-10 w-10 drop-shadow-[0_8px_20px_rgba(15,23,42,0.35)]" viewBox="0 0 32 32">
      <path
        d="M7 3l15.5 14.5h-8.2l3.1 8.1-4 1.6-3.1-8.1-5.6 5.6z"
        fill="#fff"
        stroke="#0f172a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OpenedTemplateFrame() {
  const percent = 72;
  const stepTitles = [
    'Business Snapshot',
    'Current Assets',
    'Long-Term Assets',
    'Current Liabilities',
    'Long-Term Liabilities',
    'Equity',
    'Review & Notes',
  ];

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-300 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)]">
      <div className="min-h-full bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_36%,_#f3f4f6_100%)] text-slate-900">
        <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-100">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,_#ffffff1a_0%,_transparent_52%)]" />
          <div className="relative px-4 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="max-w-[560px] space-y-2">
                <p className="inline-flex items-center rounded-full border border-blue-300/40 bg-blue-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                  Guided Template
                </p>
                <h3 className="text-[24px] font-semibold tracking-tight">2026 YTD Balance Sheet</h3>
                <p className="whitespace-nowrap text-[13px] text-slate-300">
                  Small-business lender format for companies under $10M annual revenue.
                </p>
                <p className="whitespace-nowrap text-[11px] text-slate-300/90">
                  Clean, guided input with only the context that matters so owners can finish quickly with confidence.
                </p>
              </div>

              <div className="w-full max-w-[420px] rounded-2xl border border-slate-700 bg-slate-900/60 p-3.5">
                <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Balance Sheet Snapshot</p>
                <div className="mt-2.5 grid grid-cols-4 gap-2">
                  {[
                    ['Assets', '$455,900'],
                    ['Liabilities', '$181,300'],
                    ['Equity', '$274,600'],
                    ['Net Worth', '$274,600'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-700/70 bg-slate-950/50 px-2.5 py-1.5">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-sky-300/40 bg-gradient-to-r from-cyan-100/90 via-white to-emerald-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div className="flex w-full items-center gap-3 px-4 py-2">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="truncate text-xs font-semibold text-slate-900">Balance Sheet completion</div>
                <div className="text-xs font-bold text-slate-900">{percent}%</div>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-300/70">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0284c7_0%,#14b8a6_50%,#16a34a_100%)] shadow-[0_0_12px_rgba(20,184,166,0.35)]"
                  style={{ width: `${percent}%` }}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/35 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        <main className="space-y-4 px-4 py-4">
          <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
            <div className="mb-3 grid grid-cols-[1.2fr_1.15fr_1.22fr_1.22fr_1.42fr_0.86fr_1.18fr] gap-2.5">
              {stepTitles.map((stepTitle, index) => {
                const active = index === 0;
                return (
                  <div
                    key={stepTitle}
                    className={`min-w-0 rounded-xl border px-3 py-1.5 text-left ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wide">
                      {active ? 'Current' : 'Pending'}
                    </div>
                    <div className={`${stepTitle === 'Long-Term Liabilities' ? 'text-[0.92rem] leading-[1.05rem]' : 'text-sm'} font-semibold`}>
                      {stepTitle === 'Long-Term Liabilities' ? (
                        <>
                          Long-Term
                          <br />
                          Liabilities
                        </>
                      ) : (
                        stepTitle
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <label className="text-sm font-semibold text-gray-800">Business legal name</label>
                </div>
                <div className="flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
                  Atlantic Ridge Manufacturing LLC
                </div>
              </div>
              <div />

              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <label className="text-sm font-semibold text-gray-800">Statement Type</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex h-12 w-[220px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    Year-End
                  </div>
                  <div className="flex h-12 w-[220px] items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                    Year-to-Date
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <label className="text-sm font-semibold text-gray-800">As of Date</label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-9 min-w-[120px] items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
                    Dec
                  </div>
                  <div className="flex h-9 min-w-[80px] items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
                    31
                  </div>
                  <div className="flex h-9 min-w-[100px] items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
                    2025
                  </div>
                  <div className="flex h-9 items-center rounded-md border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-700">
                    YTD: 01/01/2025 - 12/31/2025
                  </div>
                  <div className="flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700">
                    Use Today
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <label className="text-sm font-semibold text-gray-800">Accounting Method</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="w-full max-w-[390px] rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-left text-white">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">Accrual</p>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    </div>
                    <p className="mt-1 text-xs text-slate-200">
                      You record income when invoiced and expenses when incurred, even before cash moves.
                    </p>
                  </div>
                  <div className="w-full max-w-[390px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">Cash</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      You record income when cash is received and expenses when cash is paid.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">Ready to continue</p>
              <p className="mt-1 text-xs text-slate-600">
                Start with the snapshot step, then move through assets, liabilities, and review.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Current Step
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardFrame({ totalProgress }: { totalProgress: number }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-300 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)]">
      <div className="min-h-full bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_36%,_#f3f4f6_100%)] text-slate-900">
        <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-100">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,_#ffffff1a_0%,_transparent_52%)]" />
          <div className="relative px-4 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-2.5">
                <p className="inline-flex items-center rounded-full border border-blue-300/40 bg-blue-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                  Guided Financial Templates
                </p>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                  Build lender-grade documents faster
                </h1>
                <p className="text-sm text-slate-300 sm:text-base">
                  Complete Business and Personal sections with clear, structured templates.
                </p>
              </div>

              <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-900/60 p-3.5">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">
                  Overall Progress
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-3xl font-bold text-white">{totalProgress}%</p>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                    {mapProgressLabel(totalProgress)}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="space-y-4 px-4 py-4">
          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Business Section</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                3 templates
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {businessCards.map((card) => (
                <PreviewTemplateCardBlock key={card.title} {...card} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <UserRound className="h-4 w-4 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Personal Section</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                2 templates
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {personalCards.map((card) => (
                <PreviewTemplateCardBlock key={card.title} {...card} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <CircleCheck className="h-4 w-4 text-emerald-600" />
              Progress updates automatically as you fill template fields.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default function TemplatesWorkspacePreviewSvg() {
  const totalProgress = 74;
  const canvasWidth = 1080;
  const canvasHeight = 900;

  return (
    <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden rounded-none border-y border-white/15 bg-white/5 p-1 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.85)] sm:left-auto sm:w-auto sm:max-w-full sm:translate-x-0 sm:rounded-[28px] sm:border sm:p-1.5">
      <svg
        aria-label="Templates workspace preview"
        className="h-auto w-full"
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <foreignObject height={canvasHeight} width={canvasWidth} x="0" y="0">
          <div className="h-full w-full [font-family:Inter,ui-sans-serif,system-ui,sans-serif]">
            <style>{`
              .templates-demo-stage {
                position: relative;
                height: 760px;
              }

              .templates-demo-frame {
                position: absolute;
                inset: 0;
                will-change: opacity, transform;
              }

              .templates-demo-dashboard {
                animation: templatesDemoDashboard 12s ease-in-out infinite;
              }

              .templates-demo-form {
                animation: templatesDemoForm 12s ease-in-out infinite;
              }

              .templates-demo-cursor {
                position: absolute;
                left: 0;
                top: 0;
                z-index: 30;
                pointer-events: none;
                animation: templatesDemoCursor 12s ease-in-out infinite;
              }

              .templates-demo-click-ring {
                position: absolute;
                left: 0;
                top: 0;
                z-index: 20;
                height: 58px;
                width: 58px;
                border-radius: 9999px;
                border: 2px solid rgba(34, 211, 238, 0.9);
                background: rgba(34, 211, 238, 0.08);
                pointer-events: none;
                animation: templatesDemoClickRing 12s ease-in-out infinite;
              }

              @keyframes templatesDemoDashboard {
                0%, 41% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
                48%, 100% {
                  opacity: 0;
                  transform: translateY(-14px) scale(0.985);
                }
              }

              @keyframes templatesDemoForm {
                0%, 45% {
                  opacity: 0;
                  transform: translateY(18px) scale(0.985);
                }
                52%, 90% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
                100% {
                  opacity: 0;
                  transform: translateY(8px) scale(0.99);
                }
              }

              @keyframes templatesDemoCursor {
                0%, 8% {
                  opacity: 0;
                  transform: translate(86px, 710px) scale(0.92);
                }
                12% {
                  opacity: 1;
                  transform: translate(190px, 700px) scale(0.96);
                }
                22% {
                  opacity: 1;
                  transform: translate(266px, 610px) scale(1);
                }
                30% {
                  opacity: 1;
                  transform: translate(430px, 410px) scale(1);
                }
                33% {
                  opacity: 1;
                  transform: translate(430px, 410px) scale(0.9);
                }
                36% {
                  opacity: 1;
                  transform: translate(430px, 410px) scale(1);
                }
                42%, 100% {
                  opacity: 0;
                  transform: translate(442px, 406px) scale(0.96);
                }
              }

              @keyframes templatesDemoClickRing {
                0%, 24% {
                  opacity: 0;
                  transform: translate(423px, 407px) scale(0.25);
                }
                30% {
                  opacity: 0;
                  transform: translate(423px, 407px) scale(0.3);
                }
                33% {
                  opacity: 0.95;
                  transform: translate(423px, 407px) scale(0.62);
                }
                36% {
                  opacity: 0;
                  transform: translate(423px, 407px) scale(1.22);
                }
                100% {
                  opacity: 0;
                  transform: translate(423px, 407px) scale(1.22);
                }
              }
            `}</style>
            <div className="min-h-full bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_36%,_#f3f4f6_100%)] px-5 py-5 text-slate-900">
              <div className="templates-demo-stage">
                <div className="templates-demo-frame templates-demo-dashboard">
                  <DashboardFrame totalProgress={totalProgress} />
                </div>

                <div className="templates-demo-click-ring" />
                <div className="templates-demo-cursor">
                  <MousePointer />
                </div>

                <div className="templates-demo-frame templates-demo-form">
                  <OpenedTemplateFrame />
                </div>
              </div>
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
