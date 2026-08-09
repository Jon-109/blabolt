import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, FileText, Handshake, PackageCheck, ShieldAlert, Sparkles, XCircle } from 'lucide-react';

import TrackedGuideLink from '../TrackedGuideLink';
import { getLoanGuideBySlug, loanGuides } from '@/lib/loanGuides';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const siteUrl = 'https://www.businesslendingadvocate.com';

export function generateStaticParams() {
  return loanGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getLoanGuideBySlug(slug);

  if (!guide) {
    return {
      title: 'Loan Guide Not Found',
    };
  }

  const url = `${siteUrl}/loan-guides/${guide.slug}`;

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url,
      type: 'article',
      images: [
        {
          url: `${siteUrl}/images/hero.png`,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.metaTitle,
      description: guide.metaDescription,
      images: [`${siteUrl}/images/hero.png`],
    },
  };
}

export default async function LoanGuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getLoanGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const pageUrl = `${siteUrl}/loan-guides/${guide.slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: guide.metaTitle,
        description: guide.metaDescription,
        url: pageUrl,
        author: {
          '@type': 'Organization',
          name: 'Business Lending Advocate',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Business Lending Advocate',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/images/Logo.png`,
          },
        },
        mainEntityOfPage: pageUrl,
        articleSection: 'Business Loan Guides',
        keywords: guide.keywords.join(', '),
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Loan Guides',
            item: `${siteUrl}/loan-guides`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: guide.shortTitle,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  const relatedGuides = loanGuides.filter((item) => item.slug !== guide.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#155e75_0%,#0b2640_36%,#07111d_76%,#020617_100%)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:66px_66px]" />
        <div className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
          <Link href="/loan-guides" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-100 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            All loan guides
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
                {guide.shortTitle}
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                {guide.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{guide.heroSummary}</p>
            </div>
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <h2 className="text-lg font-black text-white">What this funding is usually for</h2>
              <p className="mt-3 text-sm leading-6 text-slate-200">{guide.purpose}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {guide.typicalUses.map((use) => (
                  <span key={use} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50">
                    {use}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-14">
        <div className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-black tracking-[-0.03em]">Usually a good fit when</h2>
          </div>
          <div className="mt-5 space-y-3">
            {guide.bestFor.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-rose-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-rose-600" />
            <h2 className="text-2xl font-black tracking-[-0.03em]">Usually not ideal when</h2>
          </div>
          <div className="mt-5 space-y-3">
            {guide.notIdealFor.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">The lender lens</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">What lenders usually review</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The exact lender and program matter, but these are the common pressure points for this type of request.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {guide.lenderFocus.map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <ShieldAlert className="h-5 w-5 text-cyan-700" />
                <p className="mt-3 text-sm font-bold leading-6 text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Loan process</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">How the process usually works for {guide.shortTitle.toLowerCase()}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            This is the practical sequence most borrowers should expect. Some lenders may combine steps, but the same questions usually show up during underwriting.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-5">
          {guide.process.map((step, index) => (
            <div key={step.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-4 text-lg font-black tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Documents</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">What to prepare before applying</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Missing or inconsistent documents slow down even good requests. Start with the core items lenders usually need to understand the request.
            </p>
            <TrackedGuideLink
              href="/loan-services"
              pageTemplate="loan_guide_detail"
              sectionId="documents"
              ctaId="loan_guide_documents_packaging"
              ctaLabel="Get help packaging this"
              destinationUrl="/loan-services"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              Get help packaging this
              <ArrowRight className="h-4 w-4" />
            </TrackedGuideLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {guide.requiredDocuments.map((doc) => (
              <div key={doc.title} className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <FileText className="h-5 w-5 text-cyan-200" />
                <h3 className="mt-3 font-black text-white">{doc.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{doc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="rounded-[2rem] border border-rose-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Common reasons borrowers run into problems</h2>
          <div className="mt-5 space-y-3">
            {guide.declineReasons.map((reason) => (
              <div key={reason} className="flex gap-3 text-sm leading-6 text-slate-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-cyan-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Smart preparation tips</h2>
          <div className="mt-5 space-y-3">
            {guide.preparationTips.map((tip) => (
              <div key={tip} className="flex gap-3 text-sm leading-6 text-slate-700">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Repayment reality check</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">The payment still has to work.</h2>
                <p className="mt-4 text-base leading-7 text-slate-700">{guide.repaymentNotes}</p>
              </div>
              <div className="rounded-[1.5rem] border border-cyan-100 bg-white p-5">
                <Calculator className="h-6 w-6 text-cyan-700" />
                <h3 className="mt-3 text-xl font-black">Start with a quick payment check</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{guide.serviceUpsell.dscr}</p>
                <TrackedGuideLink
                  href="/#dscr-calculator"
                  pageTemplate="loan_guide_detail"
                  sectionId="repayment_reality_check"
                  ctaId="loan_guide_dscr_check"
                  ctaLabel="See if the payment works"
                  destinationUrl="/#dscr-calculator"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  See if the payment works
                  <ArrowRight className="h-4 w-4" />
                </TrackedGuideLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <PackageCheck className="h-7 w-7 text-cyan-700" />
            <h2 className="mt-4 text-2xl font-black tracking-[-0.03em]">When loan packaging helps</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{guide.serviceUpsell.packaging}</p>
            <TrackedGuideLink
              href="/loan-services"
              pageTemplate="loan_guide_detail"
              sectionId="service_upsell"
              ctaId="loan_guide_packaging_upsell"
              ctaLabel="Explore loan packaging"
              destinationUrl="/loan-services"
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-800 transition hover:text-cyan-950"
            >
              Explore loan packaging
              <ArrowRight className="h-4 w-4" />
            </TrackedGuideLink>
          </div>
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <Handshake className="h-7 w-7 text-emerald-700" />
            <h2 className="mt-4 text-2xl font-black tracking-[-0.03em]">When brokering helps</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{guide.serviceUpsell.brokering}</p>
            <TrackedGuideLink
              href="/loan-services"
              pageTemplate="loan_guide_detail"
              sectionId="service_upsell"
              ctaId="loan_guide_brokering_upsell"
              ctaLabel="Explore lender help"
              destinationUrl="/loan-services"
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-emerald-800 transition hover:text-emerald-950"
            >
              Explore lender help
              <ArrowRight className="h-4 w-4" />
            </TrackedGuideLink>
          </div>
        </div>
      </section>

      <section className="bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">FAQ</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">Common questions about {guide.shortTitle.toLowerCase()}</h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {guide.faqs.map((faq) => (
              <div key={faq.question} className="rounded-3xl border border-slate-200 bg-white p-6">
                <h3 className="font-black text-slate-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Keep learning</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]">Related loan guides</h2>
          </div>
          <Link href="/loan-guides" className="inline-flex items-center gap-2 text-sm font-black text-cyan-800 transition hover:text-cyan-950">
            View all guides
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {relatedGuides.map((item) => (
            <Link key={item.slug} href={`/loan-guides/${item.slug}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-lg">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Guide</p>
              <h3 className="mt-2 text-xl font-black tracking-[-0.03em]">{item.shortTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.purpose}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
