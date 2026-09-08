import Link from 'next/link';
import { ArrowRight, Clock3 } from 'lucide-react';

const templates = [
  { title: 'SBA Form 413', subtitle: 'Personal Financial Statement', time: '10–15 min', href: '/services/templates/personal-financial-statement', featured: true },
  { title: 'Balance Sheet', subtitle: 'Assets, liabilities, and equity', time: '5–10 min', href: '/services/templates/balance-sheet' },
  { title: 'Income Statement', subtitle: 'Revenue, expenses, and profit', time: '8–12 min', href: '/services/templates/income-statement' },
  { title: 'Business Debt Summary', subtitle: 'Business balances and payments', time: '8–12 min', href: '/services/templates/business-debt-summary' },
  { title: 'Personal Debt Summary', subtitle: 'Guarantor balances and payments', time: '5–8 min', href: '/services/templates/personal-debt-summary' },
];

export default function TemplateLinkGrid() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {templates.map((template) => (
        <Link key={template.title} href={template.href} className={`group rounded-xl border p-3 transition hover:-translate-y-0.5 ${template.featured ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-extrabold leading-5 text-slate-950">{template.title}</p><p className="mt-0.5 text-xs leading-4 text-slate-600">{template.subtitle}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-cyan-800" /></div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-500"><Clock3 className="h-3 w-3" />{template.time} • Instant PDF</p>
        </Link>
      ))}
    </div>
  );
}
