'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Package,
  ShieldCheck,
  Upload,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/(components)/ui/dialog';
import type { TemplateKey } from '@/lib/loan-packaging/constants';

type WorkflowSection = 'loan-profile' | 'documents' | 'cover-letter' | 'package';
type DocumentStatus = 'not_started' | 'uploaded' | 'generated' | 'approved';

type DemoDocument = {
  id: string;
  name: string;
  description: string;
  status: DocumentStatus;
  fileName?: string;
  templateKey?: TemplateKey;
  templateProgress?: number;
  reason?: string;
};

type TemplateDefinition = {
  title: string;
  description: string;
  steps: string[];
  firstStepTitle: string;
  firstStepDescription: string;
};

type DemoLoanPurpose = 'Equipment Purchase' | 'Working Capital' | 'Business Acquisition';

type LoanScenario = {
  amount: string;
  useOfFunds: Array<{ description: string; amount: string }>;
  documents: DemoDocument[];
};

const templateDefinitions: Record<TemplateKey, TemplateDefinition> = {
  personal_debt_summary: {
    title: 'Personal Debt Summary',
    description: 'Complete each section to prepare a lender-ready personal debt summary.',
    steps: ['Personal Info', 'Credit Cards', 'Lines of Credit', 'Auto Loans', 'Mortgages', 'Other Debts'],
    firstStepTitle: 'Personal Information',
    firstStepDescription: 'Start with the borrower details used on the finished debt summary.',
  },
  personal_financial_statement: {
    title: 'Personal Financial Statement',
    description: 'Complete a guided SBA Form 413-style personal financial statement.',
    steps: ['Borrower Details', 'Assets', 'Debts', 'Income & Details', 'Review'],
    firstStepTitle: 'Basic borrower details',
    firstStepDescription: 'Enter the legal borrower information that will appear on the lender-ready statement.',
  },
  business_debt_summary: {
    title: 'Business Debt Summary',
    description: 'Complete each section to prepare a lender-ready business debt summary.',
    steps: ['Business Info', 'Credit Cards', 'Lines of Credit', 'Term Loans', 'Equipment Loans', 'Other Debts'],
    firstStepTitle: 'Business Information',
    firstStepDescription: 'Start with the business details used on the finished debt schedule.',
  },
  balance_sheet: {
    title: 'Business Balance Sheet',
    description: 'Build a lender-ready financial snapshot with guided assets, liabilities, and equity.',
    steps: ['Snapshot', 'Current Assets', 'Long-Term Assets', 'Current Liabilities', 'Long-Term Liabilities', 'Equity', 'Review'],
    firstStepTitle: 'Statement Snapshot',
    firstStepDescription: 'Choose the company, statement period, and accounting method before entering balances.',
  },
  income_statement: {
    title: 'Income Statement — YTD',
    description: 'Complete your lender-ready profit and loss statement and generate a polished PDF.',
    steps: ['Statement Period', 'Revenue', 'Cost of Sales', 'Operating Expenses', 'Review'],
    firstStepTitle: 'Statement Period',
    firstStepDescription: 'Set the business and reporting period for this income statement.',
  },
};

const baseDocuments: DemoDocument[] = [
  {
    id: 'personal-debt',
    name: 'Personal Debt Summary',
    description: 'Itemized monthly personal debt service and outstanding balances.',
    status: 'not_started',
    templateKey: 'personal_debt_summary',
  },
  {
    id: 'personal-financial',
    name: 'Personal Financial Statement',
    description: 'Statement of personal assets and liabilities used in guarantor strength analysis.',
    status: 'generated',
    fileName: 'Jordan-Lee-Personal-Financial-Statement.pdf',
    templateKey: 'personal_financial_statement',
    templateProgress: 100,
  },
  {
    id: 'personal-tax-2025',
    name: 'Personal Tax Return — 2025',
    description: 'Signed federal personal tax return for the most recent completed year.',
    status: 'uploaded',
    fileName: '2025-Jordan-Lee-Form-1040.pdf',
  },
  {
    id: 'personal-tax-2024',
    name: 'Personal Tax Return — 2024',
    description: 'Signed federal personal tax return for the prior completed year.',
    status: 'uploaded',
    fileName: '2024-Jordan-Lee-Form-1040.pdf',
  },
  {
    id: 'business-debt',
    name: 'Business Debt Summary',
    description: 'Current business liabilities with lender, payment, and maturity details.',
    status: 'generated',
    fileName: 'Mesa-Verde-Business-Debt-Summary.pdf',
    templateKey: 'business_debt_summary',
    templateProgress: 100,
  },
  {
    id: 'balance-sheet',
    name: 'Current Balance Sheet',
    description: 'Business assets, liabilities, and equity as of the current reporting date.',
    status: 'not_started',
    templateKey: 'balance_sheet',
  },
  {
    id: 'income-ytd',
    name: 'Income Statement — YTD',
    description: 'Current year-to-date revenue, expenses, and net profit.',
    status: 'not_started',
    templateKey: 'income_statement',
  },
  {
    id: 'income-2025',
    name: 'Income Statement — 2025',
    description: 'Full-year profit and loss statement for the most recent completed year.',
    status: 'approved',
    fileName: 'Mesa-Verde-2025-Profit-and-Loss.pdf',
  },
  {
    id: 'income-2024',
    name: 'Income Statement — 2024',
    description: 'Full-year profit and loss statement for the prior completed year.',
    status: 'approved',
    fileName: 'Mesa-Verde-2024-Profit-and-Loss.pdf',
  },
  {
    id: 'business-tax-2025',
    name: 'Business Tax Return — 2025',
    description: 'Signed federal business tax return for the most recent completed year.',
    status: 'uploaded',
    fileName: 'Mesa-Verde-2025-Form-1120S.pdf',
  },
  {
    id: 'business-tax-2024',
    name: 'Business Tax Return — 2024',
    description: 'Signed federal business tax return for the prior completed year.',
    status: 'not_started',
  },
];

const loanScenarios: Record<DemoLoanPurpose, LoanScenario> = {
  'Equipment Purchase': {
    amount: '$350,000',
    useOfFunds: [
      { description: 'Two field service vehicles', amount: '$240,000' },
      { description: 'Diagnostic equipment package', amount: '$85,000' },
      { description: 'Installation and working capital', amount: '$25,000' },
    ],
    documents: [
      {
        id: 'equipment-quote',
        name: 'Equipment Quote / Purchase Order',
        description: 'Vendor documentation supporting the equipment purchase request.',
        status: 'uploaded',
        fileName: 'Frontier-Fleet-Equipment-Quote-8841.pdf',
        reason: 'Added because Equipment Purchase is the selected loan purpose.',
      },
    ],
  },
  'Working Capital': {
    amount: '$200,000',
    useOfFunds: [
      { description: 'Payroll and technician hiring', amount: '$90,000' },
      { description: 'Parts and service inventory', amount: '$65,000' },
      { description: 'Operating cash reserve', amount: '$45,000' },
    ],
    documents: [
      {
        id: 'working-capital-bank-statements',
        name: 'Business Bank Statements — Last 3 Months',
        description: 'Recent operating account statements showing cash flow and account activity.',
        status: 'uploaded',
        fileName: 'Mesa-Verde-Bank-Statements-Jun-Aug-2026.pdf',
        reason: 'Added because Working Capital is the selected loan purpose.',
      },
      {
        id: 'working-capital-ar-aging',
        name: 'Accounts Receivable Aging',
        description: 'Current receivables aging showing customer balances and collection timing.',
        status: 'not_started',
        reason: 'Added because Working Capital is the selected loan purpose.',
      },
      {
        id: 'working-capital-ap-aging',
        name: 'Accounts Payable Aging',
        description: 'Current payables aging showing vendor obligations and payment timing.',
        status: 'not_started',
        reason: 'Added because Working Capital is the selected loan purpose.',
      },
    ],
  },
  'Business Acquisition': {
    amount: '$1,250,000',
    useOfFunds: [
      { description: 'Business purchase price', amount: '$1,050,000' },
      { description: 'Closing and due diligence costs', amount: '$75,000' },
      { description: 'Post-closing working capital', amount: '$125,000' },
    ],
    documents: [
      {
        id: 'acquisition-loi',
        name: 'LOI / Purchase Agreement',
        description: 'Current letter of intent or purchase agreement for the acquisition.',
        status: 'uploaded',
        fileName: 'Mesa-Verde-Acquisition-LOI.pdf',
        reason: 'Added because Business Acquisition is the selected loan purpose.',
      },
      {
        id: 'acquisition-target-financials',
        name: 'Target Company Financials',
        description: 'Historical financial statements for the business being acquired.',
        status: 'uploaded',
        fileName: 'Target-Company-Financials-2024-2026.pdf',
        reason: 'Added because Business Acquisition is the selected loan purpose.',
      },
      {
        id: 'acquisition-sources-uses',
        name: 'Source and Use of Funds',
        description: 'Detailed schedule showing buyer equity, loan proceeds, and transaction uses.',
        status: 'not_started',
        reason: 'Added because Business Acquisition is the selected loan purpose.',
      },
      {
        id: 'acquisition-buyer-resume',
        name: 'Buyer Resume',
        description: 'Background and operating experience for the acquiring principal.',
        status: 'uploaded',
        fileName: 'Jordan-Lee-Buyer-Resume.pdf',
        reason: 'Added because Business Acquisition is the selected loan purpose.',
      },
      {
        id: 'acquisition-projections',
        name: 'Post-Acquisition Projections',
        description: 'Projected financial performance and debt-service capacity after closing.',
        status: 'not_started',
        reason: 'Added because Business Acquisition is the selected loan purpose.',
      },
    ],
  },
};

const sectionDefinitions: Array<{
  id: WorkflowSection;
  number: number;
  title: string;
  description: string;
}> = [
  { id: 'loan-profile', number: 1, title: 'Loan Profile', description: 'Core request details reused throughout the package.' },
  { id: 'documents', number: 2, title: 'Document Checklist', description: 'Upload existing files or complete guided templates.' },
  { id: 'cover-letter', number: 3, title: 'Lender Cover Letter', description: 'The lender-facing request and repayment story.' },
  { id: 'package', number: 4, title: 'Package & Share', description: 'Build the final ZIP and secure lender link.' },
];

const completeStatuses = new Set<DocumentStatus>(['uploaded', 'generated', 'approved']);

function statusLabel(status: DocumentStatus) {
  if (status === 'generated') return 'Generated';
  if (status === 'uploaded') return 'Uploaded';
  if (status === 'approved') return 'Approved';
  return 'Not started';
}

function statusClassName(status: DocumentStatus) {
  if (status === 'generated') return 'border-indigo-200 bg-indigo-100 text-indigo-800';
  if (status === 'uploaded') return 'border-blue-200 bg-blue-100 text-blue-800';
  if (status === 'approved') return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  return 'border-stone-200 bg-stone-100 text-stone-700';
}

function MockInput({ label, value, type = 'text' }: { label: string; value: string; type?: string }) {
  const [inputValue, setInputValue] = useState(value);
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      <input type={type} value={inputValue} onChange={(event) => setInputValue(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
    </label>
  );
}

function TemplateFirstStep({ templateKey }: { templateKey: TemplateKey }) {
  const [statementType, setStatementType] = useState('Year to date');
  const template = templateDefinitions[templateKey];
  const isBusinessStatement = templateKey === 'balance_sheet' || templateKey === 'income_statement';
  const isDebtSummary = templateKey === 'personal_debt_summary' || templateKey === 'business_debt_summary';

  return (
    <div>
      <div className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid min-w-[720px] gap-2" style={{ gridTemplateColumns: `repeat(${template.steps.length}, minmax(0, 1fr))` }}>
          {template.steps.map((step, index) => (
            <div key={step} className={`min-w-0 rounded-xl border px-3 py-2 ${index === 0 ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide">{index === 0 ? 'Current' : 'Pending'}</p>
              <p className="mt-0.5 text-xs font-semibold leading-4">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            {isBusinessStatement ? <CalendarDays className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{template.firstStepTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{template.firstStepDescription}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {templateKey === 'personal_financial_statement' ? (
            <>
              <MockInput label="Your full legal name *" value="Jordan Lee" />
              <MockInput label="As of date *" value="2026-09-09" type="date" />
              <MockInput label="Home address *" value="1840 W Juniper Avenue" />
              <MockInput label="City, state, ZIP *" value="Phoenix, AZ 85007" />
            </>
          ) : null}

          {templateKey === 'personal_debt_summary' ? (
            <>
              <MockInput label="Full Name *" value="Jordan Lee" />
              <MockInput label="As of Date *" value="2026-09-09" type="date" />
            </>
          ) : null}

          {templateKey === 'business_debt_summary' ? (
            <>
              <MockInput label="Business Name *" value="Mesa Verde Equipment Co." />
              <MockInput label="As of Date *" value="2026-09-09" type="date" />
            </>
          ) : null}

          {isBusinessStatement ? (
            <>
              <MockInput label={templateKey === 'balance_sheet' ? 'Business legal name *' : 'Business Name *'} value="Mesa Verde Equipment Co." />
              <div className="hidden sm:block" />
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-slate-700">Statement Type</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Year to date', 'Year end'].map((option) => (
                    <button key={option} type="button" onClick={() => setStatementType(option)} className={`h-12 rounded-lg border px-5 text-sm font-semibold transition ${statementType === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{option}</button>
                  ))}
                </div>
              </div>
              <MockInput label={statementType === 'Year end' ? 'Year-End Date *' : 'Period End Date *'} value={statementType === 'Year end' ? '2025-12-31' : '2026-09-09'} type="date" />
              <div className="flex items-end"><div className="flex h-10 w-full items-center rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-700">{statementType === 'Year end' ? 'Jan 1 – Dec 31, 2025' : 'Jan 1 – Sep 9, 2026'}</div></div>
            </>
          ) : null}
        </div>

        {isDebtSummary ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{templateKey === 'personal_debt_summary' ? 'Personal Debts' : 'Business Debts'}</p>
                <p className="mt-1 text-xs text-slate-600">Capture one clear debt category at a time.</p>
              </div>
              <span className="text-sm text-slate-500">Step 1 of 6</span>
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">Credit Cards</p>
              <p className="mt-1 text-sm text-slate-600">How many open {templateKey === 'personal_debt_summary' ? 'personal' : 'business'} credit cards {templateKey === 'personal_debt_summary' ? 'do you currently have' : 'does your business have'}?</p>
              <div className="mt-3 flex gap-2">{['0', '1', '2', '3+'].map((count) => <button key={count} type="button" className="h-9 min-w-12 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{count}</button>)}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LoanPackagingDashboardDemo() {
  const [selectedPurpose, setSelectedPurpose] = useState<DemoLoanPurpose>('Equipment Purchase');
  const [documents, setDocuments] = useState<DemoDocument[]>([
    ...baseDocuments,
    ...loanScenarios['Equipment Purchase'].documents,
  ]);
  const [expandedSections, setExpandedSections] = useState<Record<WorkflowSection, boolean>>({
    'loan-profile': false,
    documents: true,
    'cover-letter': false,
    package: false,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null);
  const [demoNotice, setDemoNotice] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [coverLetterNotice, setCoverLetterNotice] = useState(false);

  const scenario = loanScenarios[selectedPurpose];
  const completedDocuments = documents.filter((document) => completeStatuses.has(document.status)).length;
  const weightedProgress = Math.round(25 + (completedDocuments / documents.length) * 50);
  const nextDocument = documents.find((document) => !completeStatuses.has(document.status));
  const selectedDefinition = selectedTemplate ? templateDefinitions[selectedTemplate] : null;

  const workflowCompletion = useMemo<Record<WorkflowSection, boolean>>(() => ({
    'loan-profile': true,
    documents: completedDocuments === documents.length,
    'cover-letter': false,
    package: false,
  }), [completedDocuments, documents.length]);

  const toggleSection = (section: WorkflowSection) => {
    setExpandedSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const openTemplate = (templateKey: TemplateKey) => {
    setSelectedTemplate(templateKey);
    setDemoNotice(false);
  };

  const selectLoanPurpose = (purpose: DemoLoanPurpose) => {
    setSelectedPurpose(purpose);
    setDocuments([...baseDocuments, ...loanScenarios[purpose].documents]);
    setActionMessage(null);
    setCoverLetterNotice(false);
  };

  const simulateUpload = (documentId: string) => {
    setDocuments((current) => current.map((document) => document.id === documentId ? { ...document, status: 'uploaded', fileName: `Sample-${document.name.replace(/[^a-z0-9]+/gi, '-')}.pdf` } : document));
    setActionMessage('Sample file added. In the real dashboard, your file is encrypted and saved to your secure workspace.');
  };

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_32%,_#f5f5f4_100%)] shadow-[0_28px_80px_-46px_rgba(15,23,42,0.55)]">
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_#ffffff20_0%,_transparent_55%)] opacity-20" />
        <div className="relative px-5 py-5 sm:px-7 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"><ShieldCheck className="h-4 w-4" />Small Business Loan Packaging</p>
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-100">Interactive demo</span>
              </div>
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">Build A Lender-Ready Package</h2>
              <p className="text-sm leading-5 text-slate-300">Complete each required document with clear guidance, auto-calculated templates, and secure sharing links. Everything below uses realistic sample data.</p>
            </div>
            <div className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 lg:max-w-sm">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-xs uppercase tracking-[0.08em] text-slate-400">Checklist Completion</p><p className="mt-0.5 text-3xl font-bold text-white">{weightedProgress}%</p></div>
                <span className="mb-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">In progress</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-all" style={{ width: `${weightedProgress}%` }} /></div>
              <p className="mt-2 text-sm text-slate-300">{completedDocuments} of {documents.length} required documents complete</p>
            </div>
          </div>
        </div>
      </section>

      <div className="p-3 sm:p-4 lg:p-5">
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>Explore the real workflow.</strong> Open sections, edit sample fields, try mock uploads, and launch any guided template. Nothing is saved or submitted.</p>
        </div>
        {actionMessage ? <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><span>{actionMessage}</span><button type="button" onClick={() => setActionMessage(null)} className="shrink-0 font-semibold">Dismiss</button></div> : null}

        <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="self-start space-y-3 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Workflow Status</h3>
              <ul className="mt-3 space-y-2">
                {sectionDefinitions.map((section) => (
                  <li key={section.id}>
                    <button type="button" onClick={() => toggleSection(section.id)} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${expandedSections[section.id] ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-white'}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${workflowCompletion[section.id] ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>{workflowCompletion[section.id] ? <CheckCircle2 className="h-4 w-4" /> : section.number}</span>
                      <span className="text-sm font-medium text-slate-800">{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-amber-800">Next Action</p>
              <h3 className="mt-2 font-bold text-slate-950">{nextDocument ? `Complete ${nextDocument.name}` : 'Review your cover letter'}</h3>
              <p className="mt-2 text-sm leading-5 text-slate-700">Use the guided template or upload your existing document to keep the package moving.</p>
              {nextDocument?.templateKey ? <button type="button" onClick={() => openTemplate(nextDocument.templateKey!)} className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">Use Guided Template</button> : null}
            </div>
          </aside>

          <div className="space-y-4">
            {sectionDefinitions.map((section) => (
              <section key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
                <button type="button" onClick={() => toggleSection(section.id)} className="flex w-full items-center justify-between gap-4 p-4 text-left sm:px-5 sm:py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${workflowCompletion[section.id] ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{workflowCompletion[section.id] ? <Check className="h-5 w-5" /> : section.number}</span>
                    <span><span className="block text-lg font-bold text-slate-950">{section.title}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{section.description}</span></span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-right text-xs font-medium text-slate-500 sm:block">{section.id === 'loan-profile' ? `${selectedPurpose} • ${scenario.amount}` : section.id === 'documents' ? `${completedDocuments} of ${documents.length} complete` : section.id === 'cover-letter' ? 'Not started' : 'Locked until complete'}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-500 transition ${expandedSections[section.id] ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {expandedSections[section.id] ? (
                  <div className="border-t border-slate-100 p-4 sm:p-5">
                    {section.id === 'loan-profile' ? (
                      <div>
                        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
                          <MockInput label="Business Name" value="Mesa Verde Equipment Co." />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1.5 text-sm"><span className="font-semibold text-slate-700">Loan Purpose</span><select value={selectedPurpose} onChange={(event) => selectLoanPurpose(event.target.value as DemoLoanPurpose)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{(Object.keys(loanScenarios) as DemoLoanPurpose[]).map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}</select></label>
                            <MockInput key={selectedPurpose} label="Loan Amount (USD)" value={scenario.amount} />
                          </div>
                        </div>
                        <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4">
                          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-700">Use of Funds</p><h4 className="mt-1 text-lg font-bold text-slate-950">Tell lenders exactly where the money is going</h4></div><div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right"><p className="text-[10px] font-semibold uppercase text-slate-500">Breakdown Total</p><p className="text-xl font-bold text-slate-950">{scenario.amount}</p></div></div>
                          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="grid grid-cols-[minmax(0,1fr)_120px] bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><span>What the funds will pay for</span><span>Amount</span></div>{scenario.useOfFunds.map((item) => <div key={item.description} className="grid grid-cols-[minmax(0,1fr)_120px] border-t border-slate-200 px-3 py-3 text-sm"><span className="font-medium text-slate-800">{item.description}</span><span className="font-semibold text-slate-950">{item.amount}</span></div>)}</div>
                        </div>
                      </div>
                    ) : null}

                    {section.id === 'documents' ? (
                      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {documents.map((document) => (
                          <article key={document.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-sm">
                            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="font-semibold text-slate-900">{document.name}</h4><p className="mt-1 text-xs leading-5 text-slate-600">{document.description}</p></div><span className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClassName(document.status)}`}>{statusLabel(document.status)}</span></div>
                            {document.reason ? <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] leading-4 text-blue-800">{document.reason}</p> : null}
                            <div className="pt-3">
                              {document.fileName ? <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><FileText className="h-4 w-4 shrink-0 text-slate-500" /><span className="min-w-0 truncate text-xs font-medium text-slate-700">{document.fileName}</span></div> : null}
                              <div className="flex w-full items-center gap-2">
                                {document.templateKey ? <button type="button" onClick={() => openTemplate(document.templateKey!)} className="h-10 min-w-0 flex-1 whitespace-nowrap rounded-xl border border-indigo-300 bg-indigo-50 px-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">{completeStatuses.has(document.status) ? 'Open Template' : 'Use Template'}</button> : null}
                                <button type="button" onClick={document.fileName ? undefined : () => simulateUpload(document.id)} className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-blue-300 bg-blue-50 px-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">{document.fileName ? <><Download className="h-3.5 w-3.5" />View PDF</> : <><Upload className="h-3.5 w-3.5" />Upload File</>}</button>
                                <button type="button" onClick={() => setActionMessage('More actions include replacing a file or marking a document as not needed.')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">More actions</span></button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}

                    {section.id === 'cover-letter' ? (
                      <div>
                        <div className="grid gap-2 sm:grid-cols-4">
                          {[
                            ['Business Overview', 'Business basics, customers, and strengths'],
                            ['Use of Funds', 'Breakdown, detail, and timing'],
                            ['Repayment', 'How the loan gets repaid'],
                            ['Review', 'Final notes and draft'],
                          ].map(([label, description], index) => (
                            <button key={label} type="button" onClick={() => { if (index > 0) setCoverLetterNotice(true); }} className={`rounded-xl border px-3 py-2.5 text-left ${index === 0 ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                              <span className={`block text-[10px] font-semibold uppercase tracking-[0.1em] ${index === 0 ? 'text-slate-300' : 'text-slate-400'}`}>Step {index + 1}</span>
                              <span className="mt-0.5 block text-sm font-semibold">{label}</span>
                              <span className={`mt-0.5 block text-[11px] leading-4 ${index === 0 ? 'text-slate-300' : 'text-slate-500'}`}>{description}</span>
                            </button>
                          ))}
                        </div>

                        {coverLetterNotice ? <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Demo preview only.</strong> This tour shows Business Overview, the first step of the cover-letter builder. Your secure workspace includes all four steps, cover-letter generation, editing, and approval.</span></div> : null}

                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-700">Step 1 of 4</p><h4 className="mt-1 text-lg font-bold text-slate-950">Business Overview</h4><p className="mt-1 text-sm text-slate-600">Tell lenders what the business does, who it serves, and why the operator is qualified.</p></div><span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">Sample data</span></div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <MockInput label="Business name *" value="Mesa Verde Equipment Co." />
                            <MockInput label="Industry *" value="Commercial equipment services" />
                            <MockInput label="Entity type *" value="S Corporation" />
                            <label className="space-y-1.5 text-sm md:col-span-2 xl:col-span-3"><span className="font-semibold text-slate-700">Primary product or service *</span><textarea defaultValue="Field repair, preventive maintenance, and diagnostic services for commercial equipment fleets." rows={2} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                            <label className="space-y-1.5 text-sm"><span className="font-semibold text-slate-700">Primary customers *</span><textarea defaultValue="Construction companies, municipal contractors, and regional fleet operators across central Arizona." rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                            <label className="space-y-1.5 text-sm"><span className="font-semibold text-slate-700">Top customers or client notes *</span><textarea defaultValue="Five repeat commercial accounts; no single customer represents more than 18% of annual revenue." rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                            <label className="space-y-1.5 text-sm"><span className="font-semibold text-slate-700">Owner or management experience *</span><textarea defaultValue="Jordan Lee has 14 years of commercial equipment service and fleet operations experience." rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                          </div>
                          <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <button type="button" onClick={() => setCoverLetterNotice(true)} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Next: Use of Funds</button>
                            <button type="button" onClick={() => setCoverLetterNotice(true)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Generate Cover Letter</button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {section.id === 'package' ? (
                      <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><Package className="h-6 w-6 text-slate-700" /><h4 className="mt-3 font-bold text-slate-950">Build & Download ZIP</h4><p className="mt-2 text-sm leading-6 text-slate-600">Combines the approved cover letter and completed documents into one organized lender package.</p><button type="button" disabled className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white opacity-40">Build package</button></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><FolderOpen className="h-6 w-6 text-blue-700" /><h4 className="mt-3 font-bold text-slate-950">Create Secure Lender Link</h4><p className="mt-2 text-sm leading-6 text-slate-600">Share a controlled, expiring lender portal instead of emailing loose attachments.</p><button type="button" disabled className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 opacity-40">Create lender link</button></div><p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">Complete the remaining required documents and approve the cover letter to unlock package delivery.</p></div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={selectedTemplate !== null} onOpenChange={(open) => { if (!open) { setSelectedTemplate(null); setDemoNotice(false); } }}>
        <DialogContent className="max-h-[94vh] w-[calc(100%_-_1rem)] max-w-5xl gap-0 overflow-y-auto rounded-2xl border-0 bg-slate-100 p-0 shadow-2xl sm:w-[calc(100%_-_2rem)] [&>button]:right-4 [&>button]:top-4 [&>button]:text-white">
          {selectedTemplate && selectedDefinition ? (
            <>
              <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-left text-white sm:px-7">
                <div className="absolute inset-0 bg-[linear-gradient(120deg,_#ffffff1a_0%,_transparent_52%)] opacity-20" />
                <div className="relative pr-8">
                  <p className="inline-flex items-center rounded-full border border-blue-300/40 bg-blue-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">Guided Template • Interactive Preview</p>
                  <DialogTitle className="mt-3 text-2xl font-bold text-white">{selectedDefinition.title}</DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-slate-300">{selectedDefinition.description}</DialogDescription>
                  <div className="mt-4 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[8%] rounded-full bg-gradient-to-r from-blue-400 to-emerald-400" /></div><span className="text-xs font-semibold text-slate-200">Step 1</span></div>
                </div>
              </DialogHeader>
              <div className="p-4 sm:p-6">
                {demoNotice ? <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Demo preview only.</strong> You can explore and edit step one here. Create your secure workspace to continue through the full template and generate the lender-ready PDF.</span></div> : null}
                <TemplateFirstStep key={selectedTemplate} templateKey={selectedTemplate} />
                <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">Sample entries remain in this browser preview and are not saved.</p>
                  <button type="button" onClick={() => setDemoNotice(true)} className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700">Continue to next step</button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LoanPackagingDashboardDemo;
