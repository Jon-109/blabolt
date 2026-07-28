import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, ClipboardList, FileText, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react';
import { createClient } from '@/supabase/helpers/server';
import { getAdminIdentityOrNull } from '@/lib/server/admin-access';
import { buildCustomerDashboardPayload, type CustomerDashboardPayload, type CustomerDashboardService } from '@/lib/server/customer-dashboard';

export const dynamic = 'force-dynamic';

type CustomerDashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const accentClasses: Record<CustomerDashboardService['accent'], { card: string; icon: string; button: string; bar: string }> = {
  blue: {
    card: 'border-blue-200 bg-blue-50/70',
    icon: 'bg-blue-600 text-white',
    button: 'bg-blue-700 text-white hover:bg-blue-800',
    bar: 'bg-blue-600',
  },
  emerald: {
    card: 'border-emerald-200 bg-emerald-50/70',
    icon: 'bg-emerald-600 text-white',
    button: 'bg-emerald-700 text-white hover:bg-emerald-800',
    bar: 'bg-emerald-600',
  },
  amber: {
    card: 'border-amber-200 bg-amber-50/70',
    icon: 'bg-amber-500 text-white',
    button: 'bg-amber-600 text-white hover:bg-amber-700',
    bar: 'bg-amber-500',
  },
  purple: {
    card: 'border-purple-200 bg-purple-50/70',
    icon: 'bg-purple-600 text-white',
    button: 'bg-purple-700 text-white hover:bg-purple-800',
    bar: 'bg-purple-600',
  },
};

function formatDscr(value: number | null): string {
  return value == null ? 'Not ready' : `${value.toFixed(2)}x`;
}

function ServiceCard({ service }: { service: CustomerDashboardService }) {
  const classes = accentClasses[service.accent];

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${service.enabled ? classes.card : 'border-slate-200 bg-white opacity-75'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${service.enabled ? classes.icon : 'bg-slate-100 text-slate-400'}`}>
          {service.key === 'comprehensive' ? <Sparkles className="h-5 w-5" /> : service.key === 'templates' ? <FileText className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${service.enabled ? 'bg-white text-slate-800 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
          {service.status}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{service.title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{service.description}</p>
      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-white/80 shadow-inner">
          <div className={`h-full rounded-full ${service.enabled ? classes.bar : 'bg-slate-200'}`} style={{ width: `${Math.max(0, Math.min(100, service.progressPct))}%` }} />
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-600">Next: {service.nextStep}</p>
      </div>
      {service.enabled ? (
        <Link href={service.href} className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${classes.button}`}>
          Open Service <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-400">Not assigned yet</div>
      )}
    </div>
  );
}

function TemplateAccessList({ payload }: { payload: CustomerDashboardPayload }) {
  const visibleTemplates = payload.templates.filter((template) => template.isAvailable);

  if (!visibleTemplates.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Assigned Templates</h2>
        <p className="mt-2 text-sm text-slate-600">No individual templates are assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Assigned Templates</h2>
          <p className="mt-1 text-sm text-slate-600">Only templates available to this account appear here.</p>
        </div>
        <Link href="/templates" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Open Templates</Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visibleTemplates.map((template) => (
          <Link key={template.type} href={template.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-slate-950">{template.label}</p>
              {template.isComplete ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {template.isComplete ? 'Complete' : template.isStarted ? 'In Progress' : 'Not Started'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function CustomerDashboardPage({ searchParams }: CustomerDashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const previewClientId = typeof resolvedSearchParams?.clientId === 'string' ? resolvedSearchParams.clientId : null;

  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (!user) {
    const redirectTarget = previewClientId ? `/customer-dashboard?clientId=${encodeURIComponent(previewClientId)}` : '/customer-dashboard';
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTarget)}`);
  }

  const adminIdentity = await getAdminIdentityOrNull();
  if (previewClientId && !adminIdentity) {
    redirect('/customer-dashboard');
  }

  const payload = await buildCustomerDashboardPayload({
    user,
    clientId: previewClientId,
    isAdminPreview: Boolean(previewClientId && adminIdentity),
  });

  if (!payload) {
    redirect('/loan-services');
  }

  if (!payload.client.portalEnabled && !payload.isAdminPreview) {
    redirect('/loan-services');
  }

  const enabledServices = payload.services.filter((service) => service.enabled);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),linear-gradient(180deg,#f8fafc,#eef2ff)] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        {payload.isAdminPreview ? (
          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
            Admin preview mode: you are viewing exactly what this client dashboard will show based on current access settings.
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-xl backdrop-blur">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr] lg:p-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                <ShieldCheck className="h-4 w-4" /> Business Lending Advocate Portal
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Welcome{payload.client.fullName ? `, ${payload.client.fullName.split(' ')[0]}` : ''}.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                This dashboard shows the services currently assigned to your account, your progress, and the next steps needed to move toward lender readiness.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{payload.client.businessName || 'Business profile pending'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{payload.client.email}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">{enabledServices.length} Active Service{enabledServices.length === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Readiness Snapshot</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Current DSCR</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">{formatDscr(payload.summary.dscr)}</p>
                  <p className="text-xs text-slate-500">{payload.summary.dscrYear ?? 'Complete analysis to calculate'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">Templates</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{payload.summary.templateProgressPct}%</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">Package</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{payload.summary.packageProgressPct ?? 0}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {payload.client.portalMessage ? (
          <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black text-amber-950">Message from Business Lending Advocate</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">{payload.client.portalMessage}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-4">
          {payload.services.map((service) => <ServiceCard key={service.key} service={service} />)}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <TemplateAccessList payload={payload} />
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Next Required Documents</h2>
            <p className="mt-1 text-sm text-slate-600">If you have loan packaging access, these are the next missing items.</p>
            <div className="mt-4 space-y-3">
              {payload.summary.nextRequiredDocuments.length ? payload.summary.nextRequiredDocuments.map((document) => (
                <div key={document.requirementKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">{document.displayName}</p>
                  <p className="mt-1 text-sm text-slate-600">{document.description || 'Upload or complete this item in your loan package.'}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                  No required package documents are currently waiting on you.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
