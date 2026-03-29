import Link from 'next/link';
import { ArrowRight, Handshake, Workflow } from 'lucide-react';
import { useId } from 'react';

const CUSTOMER_BOTTOM_POINTS = [
  {
    title: 'Get organized fast',
    description:
      'Instead of chasing files across folders and email threads, you can follow one clear workflow from first draft to finished package.',
  },
  {
    title: 'Look more lender-ready',
    description:
      'The dashboard helps turn scattered financial information into a cleaner, more professional package that is easier for lenders to review.',
  },
  {
    title: 'Lead with the cover letter',
    description:
      'Your cover letter introduces the request before the lender opens a single attachment, helping your purpose, amount, and story land clearly from the start.',
  },
  {
    title: 'Add brokering support when you want it',
    description:
      'When you want more than software, we can help take that finished package into real lender conversations and guide the next steps with you.',
  },
] as const;

const STEP3_FAKE_INPUTS = [
  ['Business Name', 'Riverstone Kitchen & Bar, LLC'],
  ['Street Address', '1287 South Alamo Street'],
  ['City, State ZIP', 'San Antonio, TX 78210'],
  ['Phone Number', '(210) 555-7842'],
  ['Loan Request', '$50,000'],
  ['Loan Purpose', 'Equipment Purchase'],
  ['Business Snapshot', 'Established San Antonio restaurant with growing repeat demand'],
  ['Why Now', 'Kitchen capacity is limiting peak-hour output'],
  ['Use Of Funds', 'Refrigeration, range upgrades, and added prep stations'],
  ['Repayment Story', 'Stable sales, controlled expenses, and stronger service capacity'],
] as const;

const STEP3_COVER_LETTER_PARAGRAPHS = [
  'Riverstone Kitchen & Bar, LLC is requesting $50,000 in financing to support the purchase of new kitchen equipment and upgrades to existing systems. The goal of this investment is to improve operational efficiency, increase service capacity, and support continued revenue growth.',
  'The business has been operating successfully in San Antonio, serving a consistent and growing customer base. Over time, demand has increased beyond the current kitchen’s capacity, leading to longer ticket times and limitations during peak hours. This equipment investment will allow the business to streamline food preparation, improve output during high-volume periods, and maintain a higher level of consistency and quality.',
  'The requested funds will be used to purchase commercial-grade kitchen equipment, including upgraded refrigeration units, a high-capacity range, and additional prep stations. These improvements are expected to reduce bottlenecks, lower maintenance costs from aging equipment, and support increased daily throughput.',
  'Riverstone Kitchen & Bar has demonstrated stable monthly cash flow and responsible financial management. The business maintains consistent sales, manages operating expenses effectively, and continues to build a strong local reputation. This financing is intended to support a clear next step in growth, rather than address any operational shortfalls.',
  'With the additional capacity provided by this equipment, the business expects to increase revenue during peak service hours and expand its ability to handle catering and larger group orders. These changes are expected to strengthen overall cash flow and improve long-term sustainability.',
  'This request reflects a practical and growth-oriented use of capital, aligned with the business’s current performance and trajectory. Riverstone Kitchen & Bar is seeking a financing partner to support this next phase of expansion.',
] as const;

const CHECKLIST_DEMO_ITEMS = [
  { label: 'Business Debt Summary', complete: true, status: 'Complete', highlightTemplate: false },
  { label: 'Personal Debt Summary', complete: false, status: 'Needs Work', highlightTemplate: false },
  {
    label: 'Personal Financial Statement',
    complete: false,
    status: 'Needs Work',
    highlightTemplate: true,
  },
  { label: '2026 YTD Income Statement', complete: false, status: 'Needs Work', highlightTemplate: false },
  { label: 'Balance Sheet', complete: false, status: 'Needs Work', highlightTemplate: false },
  { label: '2025 Business Tax Return', complete: true, status: 'Complete', highlightTemplate: false },
] as const;

const EXPLAINER_SCENES = [
  {
    id: 'profile',
    eyebrow: 'Step 01',
    boxTitle: 'Loan Profile',
    label: 'Loan profile foundation',
    title: 'Start with one clean loan profile',
    description:
      'Business name, loan purpose, amount, revenue, and the use-of-proceeds narrative live in one place. Save it once and the dashboard reuses the same facts throughout the package.',
    bullets: [
      'Keeps the numbers and story consistent',
      'Gives every template the same source data',
      'Removes the “what do I send first?” confusion',
    ],
    salesNote:
      'Owners stop juggling disconnected notes and start from a lender-facing summary that already feels organized.',
    accent: '#10b981',
    accentSoft: '#d1fae5',
    accentDeep: '#047857',
  },
  {
    id: 'checklist',
    eyebrow: 'Step 02',
    boxTitle: 'Checklist + Templates',
    label: 'Complete Checklist of Required Documents + Templates If Needed',
    title: 'See exactly what lenders still need',
    description:
      'The checklist turns requirements into a visible workflow. Upload documents when you have them, or launch guided templates when your financials still need to be built into lender-ready PDFs.',
    bullets: [
      'Track every required item in one view',
      'Use guided templates instead of guessing formats',
      'Watch completion move requirement by requirement',
    ],
    salesNote:
      'This is where messy folders become a cleaner underwriting file with less back-and-forth and fewer missing pieces.',
    accent: '#38bdf8',
    accentSoft: '#dbeafe',
    accentDeep: '#0369a1',
  },
  {
    id: 'cover-letter',
    eyebrow: 'Step 03',
    boxTitle: 'Cover Letter',
    label: 'Cover letter emphasis',
    title: 'The cover letter explains the request before the documents do',
    description:
      'Use a few key inputs to generate a lender-facing cover letter that explains the request, why the timing makes sense, and what supports repayment before anyone opens the attachments.',
    bullets: [
      'Enter the facts a lender needs to understand fast',
      'Generate a first draft instantly, then edit it before approval',
      'Add the approved letter directly into the package',
    ],
    salesNote:
      'A strong cover letter frames the entire file, making the request easier to understand and far more persuasive.',
    accent: '#a855f7',
    accentSoft: '#f3e8ff',
    accentDeep: '#7e22ce',
  },
  {
    id: 'portal',
    eyebrow: 'Step 04',
    boxTitle: 'Package + Portal',
    label: 'Package build + secure portal',
    title: 'Package everything cleanly and send it with one secure lender link',
    description:
      'Bundle the finished file in the right order, keep a clean record of what was built, and create secure lender links instead of stitching together scattered email attachments.',
    bullets: [
      'One-click ZIP export when the file is ready',
      'Secure lender links with password and expiration controls',
      'A cleaner handoff for underwriting and follow-up',
    ],
    salesNote:
      'The delivery feels polished, intentional, and much more credible than sending a chaotic stack of files.',
    accent: '#f59e0b',
    accentSoft: '#fef3c7',
    accentDeep: '#b45309',
  },
] as const;

function StepInlineCallout({
  scene,
  className,
  compact = false,
}: {
  scene: (typeof EXPLAINER_SCENES)[number];
  className: string;
  compact?: boolean;
}) {
  const detail = 'detail' in scene ? (scene as { detail?: string }).detail : undefined;

  return (
    <div className={`lpe-step-callout ${className}`}>
      <div
        className={`rounded-[24px] border border-slate-300 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.38)] ${
          compact ? 'px-4 py-3' : 'px-5 py-4'
        }`}
      >
        <div
          className={`flex items-center gap-2.5 ${
            compact ? 'text-[10px]' : 'text-[13px]'
          } font-black uppercase tracking-[0.24em] text-slate-900`}
        >
          <span
            className={`${compact ? 'h-[3px] w-7' : 'h-[4px] w-10'} rounded-full`}
            style={{ backgroundColor: scene.accent }}
          />
          {scene.eyebrow}
        </div>
        <h5 className={`mt-3 font-black leading-tight text-slate-950 ${compact ? 'text-[13px]' : 'text-[18px]'}`}>
          {scene.title}
        </h5>
        {detail ? (
          <p className={`mt-2 text-slate-700 ${compact ? 'text-[9px] leading-4' : 'text-[11px] leading-[1.15rem]'}`}>
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StepRail() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {EXPLAINER_SCENES.map((scene, index) => (
        <div
          key={scene.id}
          className={`lpe-step-rail-card lpe-step-rail-card-${index + 1} rounded-[1.5rem] border border-slate-200 bg-white/95 px-4 py-4 shadow-sm sm:px-5`}
        >
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: scene.accent }} />
            <p className="text-[0.72rem] font-black uppercase tracking-[0.24em] text-slate-500">{scene.eyebrow}</p>
          </div>
          <p className="mt-3 truncate text-[1.05rem] font-black leading-tight text-slate-950 sm:text-[1.2rem]">
            {scene.boxTitle}
          </p>
        </div>
      ))}
    </div>
  );
}

function StepRailMobile() {
  return (
    <div className="grid grid-cols-4 overflow-hidden border-y border-slate-200 bg-white/95 shadow-sm">
      {EXPLAINER_SCENES.map((scene, index) => (
        <div
          key={scene.id}
          className={`min-w-0 px-1.5 py-2 text-center ${index < EXPLAINER_SCENES.length - 1 ? 'border-r border-slate-200' : ''}`}
        >
          <span
            className="mx-auto block h-2 w-2 rounded-full"
            style={{ backgroundColor: scene.accent }}
          />
          <p className="mt-1 text-[0.54rem] font-black uppercase tracking-[0.14em] text-slate-500">
            {scene.eyebrow}
          </p>
          <p className="mt-1 text-[0.76rem] font-black leading-tight text-slate-950">
            {scene.boxTitle}
          </p>
        </div>
      ))}
    </div>
  );
}

function DashboardDesktopMarkup() {
  return (
    <div
      className="h-full w-full overflow-hidden rounded-[34px] border border-slate-200 bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_34%,_#f5f5f4_100%)] text-slate-900"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="lpe-dashboard-scroll-desktop h-full p-3">
        <div className="rounded-[26px] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-4 py-3.5 text-slate-100">
          <div className="flex min-h-[98px] items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/30 bg-blue-300/10 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-50">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                Small Business Loan Packaging
              </p>
              <h3
                className="mt-3 text-[35px] font-black leading-none text-white"
                style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
              >
                Build A Lender-Ready Package
              </h3>
              <p className="mt-2 max-w-[600px] text-[14px] leading-6 text-slate-300">
                Complete each required document with clear guidance, auto-calculated templates, and secure sharing links.
              </p>
            </div>

            <div className="w-[198px] shrink-0 rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">Checklist completion</p>
              <p className="mt-2 text-[39px] font-black text-white">68%</p>
              <p className="mt-1 text-[11.5px] leading-4 text-slate-300">6 of 9 required items complete</p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[172px_minmax(0,1fr)] gap-3">
        <aside className="space-y-2.5">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm">
            <h4
              className="text-[15px] font-bold text-slate-900"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
            >
              Workflow Status
            </h4>
            <div className="mt-3 space-y-2">
              {[
                ['Loan Profile', true, '1'],
                ['Document Checklist', false, '2'],
                ['Cover Letter', false, '3'],
                ['Package & Portal', false, '4'],
              ].map(([label, complete, fallback]) => (
                <div
                  key={String(label)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      complete ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {complete ? '✓' : fallback}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm">
            <p
              className="text-[15px] font-bold text-slate-900"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
            >
              Next Action
            </p>
            <p className="mt-2 text-[11px] leading-5 text-slate-600">
              Complete Personal Financial Statement and approve the cover letter to finish the lender package.
            </p>
          </div>
        </aside>

        <div className="space-y-2.5">
          <section className="lpe-section-stage lpe-section-stage-1 relative rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-sm">
            <div className="lpe-section-focus lpe-section-focus-1" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4
                  className="text-[20px] font-bold text-slate-900"
                  style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
                >
                  1. Loan Profile
                </h4>
                <p className="mt-1 text-[12px] leading-5 text-slate-600">
                  Add the core loan details once and reuse them across the package.
                </p>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Synced
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Business Name</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="lpe-step1-type lpe-step1-business text-[15px] font-semibold text-slate-800">
                      Atlas Roofing LLC
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Loan Purpose</p>
                    <span className="text-[12px] text-slate-400">▾</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="lpe-step1-type lpe-step1-purpose text-[15px] font-semibold text-slate-800">
                      Equipment Purchase
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Loan Amount</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="text-[15px] font-semibold text-slate-500">$</span>
                    <span className="lpe-step1-type lpe-step1-amount text-[15px] font-semibold text-slate-800">
                      485,000
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 min-h-[84px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Loan Purpose Description
                </p>
                <div className="mt-1.5 space-y-1 text-[13px] font-semibold text-slate-800 leading-5">
                  <span className="lpe-step1-type lpe-step1-description-1 block">
                    Use funds to purchase two additional work trucks and
                  </span>
                  <span className="lpe-step1-type lpe-step1-description-2 block">
                    expand install capacity ahead of peak season demand.
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="lpe-section-stage lpe-section-stage-2 relative rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-sm">
            <div className="lpe-section-focus lpe-section-focus-2" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4
                  className="text-[20px] font-bold text-slate-900"
                  style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
                >
                  2. Document Checklist
                </h4>
                <p className="mt-1 text-[12px] leading-5 text-slate-600">
                  Upload files or launch guided templates with PDF generation.
                </p>
              </div>
              <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                6 checklist items
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 items-start gap-2">
              {CHECKLIST_DEMO_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={`lpe-checklist-item ${item.highlightTemplate ? '' : 'lpe-checklist-item-secondary'} self-start rounded-xl border p-3 ${
                    item.complete
                      ? 'border-emerald-200 bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_100%)] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)]'
                      : 'border-slate-200 bg-slate-50/90'
                  } ${item.highlightTemplate ? 'lpe-template-card lpe-template-card-desktop' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-semibold leading-5 text-slate-900">{item.label}</p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                        {item.complete ? 'File received and checklist-ready' : 'Upload a file or start a guided template'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                        item.complete
                          ? 'border-emerald-200 bg-white text-emerald-700'
                          : 'border-amber-200 bg-white text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {item.complete ? (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-md border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-[10px] font-semibold text-emerald-800">
                        Complete
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        Ready for package
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-700">
                          Upload File
                        </span>
                        <span
                          className={`rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-[10px] font-semibold text-violet-700 ${
                            item.highlightTemplate ? 'lpe-template-cta lpe-template-cta-desktop' : ''
                          }`}
                        >
                          Start Template
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="lpe-template-note lpe-template-sidebar-note-desktop pointer-events-none absolute left-4 top-[92px] z-[24] w-[365px] rounded-[24px] border border-violet-200 bg-white px-5 py-4 shadow-[0_30px_70px_-44px_rgba(139,92,246,0.6)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700">Template Help</p>
              <p className="mt-2 text-[24px] font-black leading-[1.05] text-slate-900">
                Don&apos;t have this document?
              </p>
              <p className="mt-3 max-w-[280px] text-[16px] font-bold leading-[1.25] text-slate-700">
                We&apos;ll build it for you with a guided template form.
              </p>
            </div>
          </section>

          <section className="lpe-section-stage lpe-section-stage-3 relative rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-sm">
            <div className="lpe-section-focus lpe-section-focus-3" />
            <div>
              <h4
                className="text-[20px] font-bold text-slate-900"
                style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
              >
                3. Cover Letter
              </h4>
              <p className="mt-1 text-[12px] leading-5 text-slate-600">
                Explain the request, timing, and repayment story before the lender opens the documents.
              </p>
            </div>

            <div className="mt-3 grid grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Cover Letter Inputs</p>
                  <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-violet-700">
                    10 responses
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {STEP3_FAKE_INPUTS.map(([label, value], index) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                      <div className="mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <span className={`lpe-step3-fill lpe-step3-fill-${index + 1} block truncate text-[10px] font-semibold text-slate-700`}>
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="lpe-step3-generate rounded-xl bg-slate-900 px-3 py-2.5 text-center text-[11px] font-semibold text-white">
                    Generate Cover Letter
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Cover Letter Preview</p>
                  <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-violet-700">
                    Ready to review
                  </span>
                </div>
                <div className="lpe-step3-preview mt-3 rounded-[1.15rem] border border-slate-200 bg-white p-4 shadow-[0_26px_55px_-40px_rgba(15,23,42,0.24)]">
                  <div className="border-b border-slate-200 pb-3">
                    <p className="text-[11px] font-black text-slate-900">Riverstone Kitchen &amp; Bar, LLC</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-600">
                      1287 South Alamo Street
                      <br />
                      San Antonio, TX 78210
                      <br />
                      (210) 555-7842
                    </p>
                  </div>
                  <div className="mt-3 space-y-2.5 text-[9.5px] leading-[1.45] text-slate-700">
                    <p className="font-semibold text-slate-900">Loan Request: $50,000 - Equipment Purchase</p>
                    {STEP3_COVER_LETTER_PARAGRAPHS.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
                <div className="lpe-step3-approve mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-center text-[11px] font-semibold text-emerald-800">
                  Approve &amp; Generate PDF
                </div>
              </div>
            </div>
          </section>

          <section className="lpe-section-stage lpe-section-stage-4 relative rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-sm">
            <div className="lpe-section-focus lpe-section-focus-4" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4
                  className="text-[20px] font-bold text-slate-900"
                  style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
                >
                  4. Package Build &amp; Lender Portal
                </h4>
                <p className="mt-1 text-[12px] leading-5 text-slate-600">
                  Build one clean lender package, then share it through a secure link instead of scattered attachments.
                </p>
              </div>
              <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                Finalizing delivery
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="lpe-step4-build rounded-xl bg-slate-900 px-3 py-2.5 text-[11px] font-semibold text-white">
                  Build &amp; Download ZIP
                </div>
                <div className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[11px] font-semibold text-slate-700">
                  Download Latest ZIP
                </div>
                <p className="text-[10px] font-medium text-slate-500">Last package build: Apr 14, 2026</p>
              </div>

              <div className="lpe-step4-toast rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] text-emerald-900 shadow-[0_22px_44px_-28px_rgba(16,185,129,0.35)]">
                <p className="font-semibold uppercase tracking-[0.12em] text-emerald-700">Download Complete</p>
                <p className="mt-1 font-medium">Riverstone_Kitchen_Bar_Loan_Package.zip is ready.</p>
              </div>

              <div className="lpe-step4-package-note rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[10.5px] text-slate-700">
                Package created with 9 document files (4.8 MB).
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                <h3 className="text-[14px] font-bold text-slate-900">Create Lender Access Link</h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1 text-sm">
                    <p className="text-[10px] font-semibold text-slate-700">Portal Title</p>
                    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-medium text-slate-800">
                      Riverstone Equipment Request
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-[10px] font-semibold text-slate-700">Portal Password</p>
                    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-medium text-slate-800">
                      ••••••••••••
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-[10px] font-semibold text-slate-700">Expires In (Days)</p>
                    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-medium text-slate-800">
                      14
                    </div>
                  </div>
                </div>

                <div className="lpe-step4-link inline-flex items-center gap-2 rounded-lg border border-blue-400 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  Create Secure Lender Link
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-slate-900">Active Lender Links</h3>
                  <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-500" />
                </div>

                <article className="lpe-step4-link-card rounded-lg border border-slate-200 bg-white p-2.5 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-900">Riverstone Equipment Request</p>
                      <p className="text-[9px] text-slate-500">Expires Apr 14, 2026 · Accesses 2</p>
                    </div>
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500">Share URL</p>
                    <p className="mt-1 text-[9px] font-medium text-slate-700">portal.blabolt.com/package/riverstone-kitchen-bar</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-semibold text-slate-700">
                    <div className="rounded border border-slate-300 px-2 py-1">Copy URL</div>
                    <div className="rounded border border-slate-300 px-2 py-1">Open</div>
                    <div className="rounded border border-slate-300 px-2 py-1">Revoke</div>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMobileMarkup() {
  return (
    <div
      className="h-full w-full overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_32%,_#f5f5f4_100%)] text-slate-900"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="lpe-dashboard-scroll-mobile h-full p-2.5">
        <div className="rounded-[24px] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-4 py-4 text-slate-100">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/30 bg-blue-300/10 px-3.5 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-blue-50">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            Loan Packaging
          </p>
          <h3
            className="mt-3 text-[26px] font-black leading-none text-white"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
          >
            Build A Lender-Ready Package
          </h3>
          <p className="mt-2 max-w-[248px] text-[11px] leading-5 text-slate-300">
            Complete each required document with clear guidance, auto-calculated templates, and secure sharing links.
          </p>
          <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Checklist completion</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="text-[31px] font-black text-white">68%</p>
              <p className="text-right text-[9.5px] leading-4 text-slate-300">6 of 9 items complete</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h4
              className="text-[14px] font-bold text-slate-900"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
            >
              Workflow Status
            </h4>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Live
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {['Loan Profile', 'Checklist', 'Cover Letter', 'Package'].map((label, index) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center">
                <div
                  className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${
                    index === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {index === 0 ? '✓' : index + 1}
                </div>
                <p className="mt-1 text-[8px] font-semibold leading-3 text-slate-700">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lpe-section-stage lpe-section-stage-mobile-1 relative rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-sm">
          <div className="lpe-section-focus lpe-section-focus-mobile-1" />
          <h4
            className="text-[16px] font-bold text-slate-900"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
          >
            1. Loan Profile
          </h4>
          <p className="mt-1 text-[10px] leading-4 text-slate-600">
            Add the core loan details once and reuse them across the package.
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">Business Name</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="lpe-step1-type lpe-step1-business text-[11px] font-semibold text-slate-800">
                    Atlas Roofing
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">Loan Purpose</p>
                  <span className="text-[9px] text-slate-400">▾</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="lpe-step1-type lpe-step1-purpose text-[11px] font-semibold text-slate-800">
                    Equipment
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">Loan Amount</p>
                <div className="mt-1 flex items-center gap-0.5">
                  <span className="text-[11px] font-semibold text-slate-500">$</span>
                  <span className="lpe-step1-type lpe-step1-amount text-[11px] font-semibold text-slate-800">485k</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 min-h-[62px]">
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Purpose Description
              </p>
              <div className="mt-1 space-y-0.5 text-[10px] font-semibold text-slate-800 leading-4">
                <span className="lpe-step1-type lpe-step1-description-1 block">
                  Buy trucks and expand
                </span>
                <span className="lpe-step1-type lpe-step1-description-2 block">
                  install capacity.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lpe-section-stage lpe-section-stage-mobile-2 relative rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-sm">
          <div className="lpe-section-focus lpe-section-focus-mobile-2" />
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4
                className="text-[16px] font-bold text-slate-900"
                style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
              >
                2. Document Checklist
              </h4>
              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                Upload files or launch guided templates with PDF generation.
              </p>
            </div>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-sky-700">
              6 items
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="lpe-template-note lpe-template-sidebar-note-mobile rounded-xl border border-violet-200 bg-white px-2.5 py-2 shadow-[0_20px_40px_-30px_rgba(139,92,246,0.55)]">
              <p className="text-[7.5px] font-semibold uppercase tracking-[0.12em] text-violet-700">Template Help</p>
              <p className="mt-1 text-[12px] font-black leading-[1.05] text-slate-900">
                Don&apos;t have this document?
              </p>
              <p className="mt-1.5 text-[9px] font-bold leading-[1.2] text-slate-700">
                We&apos;ll build it for you with a guided template form.
              </p>
            </div>
            {CHECKLIST_DEMO_ITEMS.map((item) => (
              <div
                key={item.label}
                className={`lpe-checklist-item ${item.highlightTemplate ? '' : 'lpe-checklist-item-secondary'} rounded-xl border px-2 py-2 ${
                  item.complete
                    ? 'border-emerald-200 bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_100%)]'
                    : 'border-slate-200 bg-slate-50'
                } ${item.highlightTemplate ? 'lpe-template-card lpe-template-card-mobile' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold leading-4 text-slate-900">{item.label}</p>
                    <p className="mt-0.5 text-[8px] leading-3 text-slate-500">
                      {item.complete ? 'Checklist-ready' : 'Upload or start template'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.12em] ${
                      item.complete
                        ? 'border-emerald-200 bg-white text-emerald-700'
                        : 'border-amber-200 bg-white text-amber-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {item.complete ? (
                  <div className="mt-2">
                    <span className="rounded-md border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[8px] font-semibold text-emerald-800">
                      Complete
                    </span>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-[8px] font-semibold text-blue-700">
                        Upload File
                      </span>
                      <span
                        className={`rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-[8px] font-semibold text-violet-700 ${
                          item.highlightTemplate ? 'lpe-template-cta lpe-template-cta-mobile' : ''
                        }`}
                      >
                        Start Template
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lpe-section-stage lpe-section-stage-mobile-3 relative rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-sm">
          <div className="lpe-section-focus lpe-section-focus-mobile-3" />
          <h4
            className="text-[16px] font-bold text-slate-900"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
          >
            3. Cover Letter
          </h4>
          <p className="mt-1 text-[10px] leading-4 text-slate-600">
            Explain the request before the lender opens the package.
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500">Cover Letter Inputs</p>
                <span className="rounded-full border border-violet-200 bg-white px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.12em] text-violet-700">
                  10 fields
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {STEP3_FAKE_INPUTS.map(([label, value], index) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white px-2 py-2">
                    <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                    <div className="mt-1 overflow-hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1.5">
                      <span className={`lpe-step3-fill lpe-step3-fill-${index + 1} block truncate text-[7.5px] font-semibold text-slate-700`}>
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="lpe-step3-generate rounded-xl bg-slate-900 px-2.5 py-2 text-center text-[8px] font-semibold text-white">
                Generate Cover Letter
              </div>
            </div>
            <div className="lpe-step3-preview rounded-xl border border-slate-200 bg-white px-2 py-2">
              <div className="border-b border-slate-200 pb-2">
                <p className="text-[8px] font-black text-slate-900">Riverstone Kitchen &amp; Bar, LLC</p>
                <p className="mt-0.5 text-[6.8px] leading-3 text-slate-600">
                  1287 South Alamo Street
                  <br />
                  San Antonio, TX 78210
                  <br />
                  (210) 555-7842
                </p>
              </div>
              <div className="mt-2 space-y-1.5 text-[7px] leading-[1.35] text-slate-700">
                <p className="font-semibold text-slate-900">Loan Request: $50,000 - Equipment Purchase</p>
                {STEP3_COVER_LETTER_PARAGRAPHS.slice(0, 4).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="lpe-step3-approve rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-center text-[8px] font-semibold text-emerald-800">
              Approve &amp; Generate PDF
            </div>
          </div>
        </div>

        <div className="lpe-section-stage lpe-section-stage-mobile-4 relative rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-sm">
          <div className="lpe-section-focus lpe-section-focus-mobile-4" />
          <div className="flex items-center justify-between gap-2">
            <h4
              className="text-[16px] font-bold text-slate-900"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
            >
              4. Package + Portal
            </h4>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-700">
              Finalizing
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-slate-600">
            Bundle the full package and share one secure lender link.
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="lpe-step4-build rounded-xl bg-slate-900 px-2.5 py-2 text-[8px] font-semibold text-white">Build &amp; Download ZIP</div>
              <div className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-[8px] font-semibold text-slate-700">
                Download Latest ZIP
              </div>
              <p className="text-[7px] font-medium text-slate-500">Last build: Apr 14, 2026</p>
            </div>
            <div className="lpe-step4-toast rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-[7.5px] text-emerald-900">
              <p className="font-semibold uppercase tracking-[0.12em] text-emerald-700">Download Complete</p>
              <p className="mt-1 font-medium">Riverstone package ZIP is ready.</p>
            </div>
            <div className="lpe-step4-package-note rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-[7.5px] font-medium text-slate-700">
              Package created with 9 document files (4.8 MB).
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1.5">
              <p className="text-[8px] font-semibold text-slate-900">Create Lender Access Link</p>
              <div className="grid grid-cols-1 gap-1.5">
                <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
                  <p className="text-[7px] font-semibold text-slate-700">Portal Title</p>
                  <p className="mt-1 text-[7.5px] font-medium text-slate-800">Riverstone Equipment Request</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
                    <p className="text-[7px] font-semibold text-slate-700">Portal Password</p>
                    <p className="mt-1 text-[7.5px] font-medium text-slate-800">••••••••••••</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
                    <p className="text-[7px] font-semibold text-slate-700">Expires In (Days)</p>
                    <p className="mt-1 text-[7.5px] font-medium text-slate-800">14</p>
                  </div>
                </div>
              </div>
              <div className="lpe-step4-link inline-flex items-center gap-2 rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-[8px] font-semibold text-blue-700">
                Create Secure Lender Link
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-semibold text-slate-900">Active Lender Links</p>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-slate-500" />
              </div>
              <article className="lpe-step4-link-card rounded-lg border border-slate-200 bg-white p-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[8px] font-semibold text-slate-900">Riverstone Equipment Request</p>
                    <p className="text-[7px] text-slate-500">Expires Apr 14, 2026 · Accesses 2</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[6.5px] font-semibold text-emerald-700">
                    Active
                  </span>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
                  <p className="text-[6.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">Share URL</p>
                  <p className="mt-1 text-[7px] font-medium text-slate-700">portal.blabolt.com/package/riverstone-kitchen-bar</p>
                </div>
                <div className="flex flex-wrap gap-1 text-[7px] font-semibold text-slate-700">
                  <div className="rounded border border-slate-300 px-1.5 py-1">Copy URL</div>
                  <div className="rounded border border-slate-300 px-1.5 py-1">Open</div>
                  <div className="rounded border border-slate-300 px-1.5 py-1">Revoke</div>
                </div>
              </article>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function DesktopSceneCallout({
  scene,
}: {
  scene: (typeof EXPLAINER_SCENES)[number];
}) {
  return (
    <div
      className="h-full rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-[0_38px_90px_-48px_rgba(15,23,42,0.65)] backdrop-blur"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: scene.accent }} />
        {scene.eyebrow}
      </div>

      <div className="mt-4 rounded-[26px] border border-slate-200 p-5" style={{ backgroundColor: scene.accentSoft }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: scene.accentDeep }}>
          {scene.label}
        </p>
        <h3 className="mt-3 text-[30px] font-black leading-[1.08] text-slate-950">{scene.title}</h3>
        <p className="mt-3 text-[14px] leading-7 text-slate-700">{scene.description}</p>
      </div>

      <div className="mt-5 space-y-3">
        {scene.bullets.map((bullet) => (
          <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: scene.accent }} />
            <p className="text-[13px] leading-6 text-slate-700">{bullet}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Why this sells your service</p>
        <p className="mt-2 text-[13px] leading-6 text-slate-700">{scene.salesNote}</p>
      </div>
    </div>
  );
}

function MobileSceneCallout({
  scene,
}: {
  scene: (typeof EXPLAINER_SCENES)[number];
}) {
  return (
    <div
      className="h-full rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_34px_72px_-44px_rgba(15,23,42,0.65)] backdrop-blur"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: scene.accent }} />
        {scene.eyebrow}
      </div>

      <div className="mt-4 rounded-[22px] border border-slate-200 p-4" style={{ backgroundColor: scene.accentSoft }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: scene.accentDeep }}>
          {scene.label}
        </p>
        <h3 className="mt-2 text-[22px] font-black leading-[1.08] text-slate-950">{scene.title}</h3>
        <p className="mt-3 text-[12px] leading-6 text-slate-700">{scene.description}</p>
      </div>

      <div className="mt-4 space-y-2.5">
        {scene.bullets.map((bullet) => (
          <div key={bullet} className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: scene.accent }} />
            <p className="text-[11px] leading-5 text-slate-700">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopExplainerSvg() {
  const idPrefix = useId().replace(/:/g, '');
  const frameGlowId = `${idPrefix}-frame-glow`;
  const accentGradientId = `${idPrefix}-accent-gradient`;

  return (
    <svg
      viewBox="0 0 1380 1000"
      aria-hidden="true"
      className="loan-packaging-explainer-svg block h-auto w-full"
    >
      <defs>
        <linearGradient id={accentGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="45%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id={frameGlowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="26" stdDeviation="26" floodColor="#0f172a" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1380" height="1000" rx="44" fill="#f8fafc" />
      <circle cx="170" cy="126" r="104" fill="#cffafe" opacity="0.8" className="lpe-float-slow" />
      <circle cx="1228" cy="160" r="116" fill="#dbeafe" opacity="0.85" className="lpe-float-reverse" />
      <circle cx="1180" cy="900" r="118" fill="#e0f2fe" opacity="0.68" className="lpe-float-slow" />
      <rect
        x="24"
        y="24"
        width="1332"
        height="952"
        rx="38"
        fill="url(#accentGradientId)"
        opacity="0.04"
      />

      <g filter={`url(#${frameGlowId})`}>
        <rect x="44" y="114" width="1292" height="880" rx="36" fill="#0f172a" opacity="0.08" />
        <rect x="50" y="108" width="1292" height="880" rx="36" fill="#e2e8f0" />
        <rect x="62" y="120" width="1268" height="856" rx="34" fill="#ffffff" />
        <foreignObject x="62" y="120" width="1268" height="856">
          <DashboardDesktopMarkup />
        </foreignObject>
      </g>

    </svg>
  );
}

export default function LoanPackagingExplainer() {
  return (
    <section className="bg-white py-8 sm:py-16" data-reveal>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="home-reveal overflow-visible rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_46%,#ffffff_100%)] p-4 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.32)] sm:overflow-hidden sm:p-7 lg:p-8">
          <div className="mx-auto max-w-5xl px-0 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-cyan-900 sm:px-4 sm:py-2 sm:text-[0.68rem] sm:tracking-[0.22em]">
              <Workflow className="h-4 w-4" />
              See How Loan Packaging Works
            </div>

            <h2 className="mx-auto mt-4 max-w-[16ch] text-[1.72rem] font-black leading-[1.06] tracking-tight text-slate-900 sm:mt-5 sm:max-w-none sm:text-4xl lg:text-[3.2rem] lg:leading-[1.03]">
              A clearer, more convincing way to present your business to lenders.
            </h2>

            <p className="mx-auto mt-3 max-w-[34ch] text-[13px] leading-5 text-slate-600 sm:mt-4 sm:max-w-4xl sm:text-lg sm:leading-7">
              Our loan packaging dashboard helps you organize the request, complete lender-ready documents, create a
              strong cover letter, and send everything in a cleaner format that is easier for lenders to review.
            </p>
          </div>

          <div className="mt-4 sm:hidden">
            <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
              <StepRailMobile />
            </div>
            <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
              <DesktopExplainerSvg />
            </div>
          </div>

          <div className="relative mt-8 hidden sm:block">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-1 sm:px-2">
              <StepRail />
            </div>
            <div className="pointer-events-none absolute inset-x-8 top-8 h-28 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 right-6 h-36 w-36 rounded-full bg-sky-300/20 blur-3xl" />
            <DesktopExplainerSvg />
          </div>

          <div className="mt-5 grid gap-3 sm:gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4">
              {CUSTOMER_BOTTOM_POINTS.map((item) => (
                <article key={item.title} className="rounded-[1.2rem] border border-slate-200 bg-white/92 p-3 shadow-sm sm:rounded-[1.6rem] sm:p-5">
                  <h3 className="text-[13px] font-black leading-4.5 text-slate-900 sm:text-lg sm:leading-5">{item.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-4 text-slate-600 sm:mt-2 sm:text-base sm:leading-6">{item.description}</p>
                </article>
              ))}
            </div>

            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-950 p-3.5 text-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.75)] sm:rounded-[1.8rem] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Why clients love this</p>
              <h3 className="mt-2 text-[1.15rem] font-black leading-tight sm:text-2xl">The cover letter gives your package a voice.</h3>
              <p className="mt-2 text-[12px] leading-5 text-slate-300 sm:mt-3 sm:text-base sm:leading-6">
                Before a lender gets into statements and supporting documents, the cover letter helps them understand
                what you need, why you need it, and why the request makes sense now. That first impression matters.
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:mt-6 sm:gap-3">
                <Link
                  href="/loan-services"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[13px] font-bold text-slate-950 transition hover:bg-slate-100 sm:px-6 sm:py-3.5 sm:text-base"
                >
                  Explore Loan Packaging
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/loan-services"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-white/15 sm:px-6 sm:py-3.5 sm:text-base"
                >
                  Explore Brokering Support
                  <Handshake className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
