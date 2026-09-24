import 'server-only';

import { escapeEmailHtml, getPublicSiteUrl } from '@/lib/email';

export type DscrEmailBand =
  | 'needs-improvement'
  | 'very-tight'
  | 'borderline'
  | 'solid-start'
  | 'strong-position'
  | 'excellent-cushion';

export interface DscrEmailResultData {
  firstName?: string;
  businessName?: string;
  email: string;
  dscr: number;
  dscrBand: DscrEmailBand;
  loanPurpose: string;
  requestedAmount: number;
  monthlyNetIncome: number;
  currentMonthlyDebtService: number;
  proposedMonthlyPayment: number;
  totalMonthlyDebtService: number;
  interestRatePct: number;
  termMonths: number;
  downPaymentPct: number;
  recommendedAction?: 'analysis' | 'packaging';
  marketingConsent: boolean;
  unsubscribeToken: string;
}

type Recommendation = {
  label: string;
  headline: string;
  explanation: string;
  nextStep: string;
  ctaLabel: string;
  ctaPath: string;
  accent: string;
};

const RECOMMENDATIONS: Record<DscrEmailBand, Recommendation> = {
  'needs-improvement': {
    label: 'Needs Improvement',
    headline: 'The current request appears to need restructuring before lender outreach.',
    explanation: 'The monthly cash flow entered does not fully cover the current and proposed monthly debt service. A smaller request, lower payment, stronger documented income, or different structure may be needed.',
    nextStep: 'Complete the free bank-level analysis to review historical periods, existing debts, and supported adjustments before spending time on applications.',
    ctaLabel: 'Start Free Bank-Level Analysis',
    ctaPath: '/comprehensive-cash-flow-analysis?new=1',
    accent: '#dc2626',
  },
  'very-tight': {
    label: 'Very Tight',
    headline: 'The payment is technically covered, but the current cushion is thin.',
    explanation: 'Many lenders look for a stronger margin above required debt payments. Small changes in revenue or expenses could materially affect this result.',
    nextStep: 'Use the comprehensive analysis to validate the inputs and test a different amount, term, rate, or documented cash-flow adjustment.',
    ctaLabel: 'Validate With Full Analysis',
    ctaPath: '/comprehensive-cash-flow-analysis?new=1',
    accent: '#ea580c',
  },
  borderline: {
    label: 'Borderline',
    headline: 'The request is close to a common lender benchmark but may still need support.',
    explanation: 'The result is near the range many lenders review more closely. Documentation quality, historical consistency, credit, collateral, and the exact lender policy still matter.',
    nextStep: 'Complete the comprehensive analysis, then organize the supporting documents before approaching lenders.',
    ctaLabel: 'Complete Bank-Level Analysis',
    ctaPath: '/comprehensive-cash-flow-analysis?new=1',
    accent: '#ca8a04',
  },
  'solid-start': {
    label: 'Solid Start',
    headline: 'The estimated payment appears reasonably supportable from the inputs provided.',
    explanation: 'This initial result is encouraging, but a lender will still verify historical cash flow, existing debt, credit, collateral, and the complete application file.',
    nextStep: 'Validate the result with the comprehensive analysis or begin organizing a lender-ready loan package.',
    ctaLabel: 'Explore Loan Packaging',
    ctaPath: '/loan-services',
    accent: '#059669',
  },
  'strong-position': {
    label: 'Strong Position',
    headline: 'The estimated payment appears to have a strong cash-flow cushion.',
    explanation: 'The result is above a common DSCR benchmark based on the information entered. It is not an approval, and the lender will still verify the complete borrower profile.',
    nextStep: 'Build the supporting package and lender narrative so the request is as clear as the initial coverage result.',
    ctaLabel: 'Build My Loan Package',
    ctaPath: '/loan-services',
    accent: '#047857',
  },
  'excellent-cushion': {
    label: 'Excellent Cushion',
    headline: 'The estimated payment appears to have a substantial cash-flow cushion.',
    explanation: 'The initial DSCR is well above a common benchmark based on the information entered. Approval still depends on verification, credit, collateral, loan purpose, and lender fit.',
    nextStep: 'Prepare a complete lender file or explore brokering support to move the request into lender outreach.',
    ctaLabel: 'Prepare for Lender Outreach',
    ctaPath: '/loan-services',
    accent: '#065f46',
  },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildDscrResultEmail(data: DscrEmailResultData) {
  const recommendation = RECOMMENDATIONS[data.dscrBand];
  const siteUrl = getPublicSiteUrl();
  const ctaUrl = `${siteUrl}${recommendation.ctaPath}`;
  const unsubscribeUrl = `${siteUrl}/email/unsubscribe?token=${encodeURIComponent(data.unsubscribeToken)}`;
  const greeting = data.firstName?.trim() ? `Hi ${escapeEmailHtml(data.firstName.trim())},` : 'Hello,';
  const businessLine = data.businessName?.trim()
    ? `<p style="margin:0 0 18px;color:#475569;">Result prepared for <strong>${escapeEmailHtml(data.businessName.trim())}</strong>.</p>`
    : '';
  const consentFooter = data.marketingConsent
    ? `<p style="margin:8px 0 0;font-size:12px;color:#64748b;">You also asked to receive occasional financing-readiness guidance. You can <a href="${unsubscribeUrl}" style="color:#0f766e;">unsubscribe here</a>.</p>`
    : '<p style="margin:8px 0 0;font-size:12px;color:#64748b;">This transactional email was sent because you requested a copy of your DSCR result.</p>';

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:680px;margin:0 auto;padding:28px 14px;">
      <div style="background:#071824;color:#fff;border-radius:18px 18px 0 0;padding:26px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#a5f3fc;">Business Lending Advocate</p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;">Your DSCR result and recommended next step</h1>
      </div>
      <div style="background:#fff;border-radius:0 0 18px 18px;padding:26px;box-shadow:0 16px 45px rgba(15,23,42,.08);">
        <p style="margin:0 0 14px;font-size:16px;">${greeting}</p>
        ${businessLine}
        <div style="border:1px solid #cbd5e1;border-radius:16px;padding:20px;text-align:center;background:#f8fafc;">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Estimated DSCR</p>
          <p style="margin:8px 0 4px;font-size:46px;font-weight:800;color:${recommendation.accent};">${data.dscr.toFixed(2)}x</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:${recommendation.accent};">${recommendation.label}</p>
        </div>
        <h2 style="margin:24px 0 8px;font-size:20px;">${recommendation.headline}</h2>
        <p style="margin:0 0 14px;line-height:1.65;color:#334155;">${recommendation.explanation}</p>
        <p style="margin:0 0 22px;line-height:1.65;color:#334155;"><strong>Recommended next step:</strong> ${recommendation.nextStep}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 22px;font-size:14px;">
          <tr><td style="padding:9px;border-bottom:1px solid #e2e8f0;color:#64748b;">Loan purpose</td><td style="padding:9px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${escapeEmailHtml(data.loanPurpose)}</td></tr>
          <tr><td style="padding:9px;border-bottom:1px solid #e2e8f0;color:#64748b;">Requested amount</td><td style="padding:9px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCurrency(data.requestedAmount)}</td></tr>
          <tr><td style="padding:9px;border-bottom:1px solid #e2e8f0;color:#64748b;">Monthly net income entered</td><td style="padding:9px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCurrency(data.monthlyNetIncome)}</td></tr>
          <tr><td style="padding:9px;border-bottom:1px solid #e2e8f0;color:#64748b;">Current monthly debt</td><td style="padding:9px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCurrency(data.currentMonthlyDebtService)}</td></tr>
          <tr><td style="padding:9px;border-bottom:1px solid #e2e8f0;color:#64748b;">Estimated proposed payment</td><td style="padding:9px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCurrency(data.proposedMonthlyPayment)}</td></tr>
          <tr><td style="padding:9px;color:#64748b;">Assumptions</td><td style="padding:9px;text-align:right;font-weight:700;">${data.interestRatePct.toFixed(2)}% / ${data.termMonths} months</td></tr>
        </table>
        <a href="${ctaUrl}" style="display:block;border-radius:12px;background:#0f172a;color:#fff;text-decoration:none;text-align:center;padding:14px 18px;font-weight:700;">${recommendation.ctaLabel}</a>
        <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;line-height:1.55;color:#64748b;">This estimate is based only on the information and assumptions entered into the calculator. It is not a loan approval, credit decision, commitment, or substitute for lender underwriting.</p>
          ${consentFooter}
        </div>
      </div>
    </div>
  </body>
</html>`;

  const text = `${greeting}\n\nYour estimated DSCR is ${data.dscr.toFixed(2)}x (${recommendation.label}).\n\n${recommendation.headline}\n${recommendation.explanation}\n\nRecommended next step: ${recommendation.nextStep}\n\nLoan purpose: ${data.loanPurpose}\nRequested amount: ${formatCurrency(data.requestedAmount)}\nMonthly net income: ${formatCurrency(data.monthlyNetIncome)}\nCurrent monthly debt: ${formatCurrency(data.currentMonthlyDebtService)}\nEstimated proposed payment: ${formatCurrency(data.proposedMonthlyPayment)}\nAssumptions: ${data.interestRatePct.toFixed(2)}% / ${data.termMonths} months\n\n${recommendation.ctaLabel}: ${ctaUrl}\n\nThis estimate is not a loan approval, credit decision, or commitment.${data.marketingConsent ? `\n\nUnsubscribe: ${unsubscribeUrl}` : ''}`;

  return {
    subject: `Your DSCR result: ${data.dscr.toFixed(2)}x (${recommendation.label})`,
    html,
    text,
  };
}

export function buildInternalDscrLeadEmail(data: DscrEmailResultData) {
  const recommendation = RECOMMENDATIONS[data.dscrBand];
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;"><h1>New DSCR result lead</h1><p><strong>${escapeEmailHtml(data.email)}</strong> requested their DSCR result.</p><table style="border-collapse:collapse;"><tr><td style="padding:6px 12px 6px 0;">DSCR</td><td><strong>${data.dscr.toFixed(2)}x — ${recommendation.label}</strong></td></tr><tr><td style="padding:6px 12px 6px 0;">Name</td><td>${escapeEmailHtml(data.firstName || 'Not provided')}</td></tr><tr><td style="padding:6px 12px 6px 0;">Business</td><td>${escapeEmailHtml(data.businessName || 'Not provided')}</td></tr><tr><td style="padding:6px 12px 6px 0;">Purpose</td><td>${escapeEmailHtml(data.loanPurpose)}</td></tr><tr><td style="padding:6px 12px 6px 0;">Requested</td><td>${formatCurrency(data.requestedAmount)}</td></tr><tr><td style="padding:6px 12px 6px 0;">Monthly income</td><td>${formatCurrency(data.monthlyNetIncome)}</td></tr><tr><td style="padding:6px 12px 6px 0;">Total debt service</td><td>${formatCurrency(data.totalMonthlyDebtService)}</td></tr><tr><td style="padding:6px 12px 6px 0;">Marketing consent</td><td>${data.marketingConsent ? 'Yes' : 'No'}</td></tr></table></body></html>`;
  return {
    subject: `DSCR lead ${data.dscr.toFixed(2)}x — ${escapeEmailHtml(data.loanPurpose)}`,
    html,
    text: `New DSCR result lead\nEmail: ${data.email}\nName: ${data.firstName || 'Not provided'}\nBusiness: ${data.businessName || 'Not provided'}\nDSCR: ${data.dscr.toFixed(2)}x (${recommendation.label})\nPurpose: ${data.loanPurpose}\nRequested: ${formatCurrency(data.requestedAmount)}\nMarketing consent: ${data.marketingConsent ? 'Yes' : 'No'}`,
  };
}
