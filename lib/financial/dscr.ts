export interface LoanPurpose {
  title: string;
  description: string;
  menuSubtitle?: string;
  defaultTerm: number;
  defaultRate: number;
  defaultDownPaymentPct?: number;
  paymentMode?: 'amortized' | 'interest_only';
}

export type LoanPurposeKey = keyof typeof loanPurposes;

export const DSCR_BENCHMARK = 1.25;
export const DSCR_GAUGE_MAX = 1.75;

export const loanPurposes = {
  'Working Capital': {
    title: 'Working Capital',
    description: 'Use this for everyday business costs like payroll, rent, inventory, or short-term cash flow needs.',
    menuSubtitle: 'Payroll, Rent, Inventory, And Everyday Costs',
    defaultTerm: 24,
    defaultRate: 0.08,
    defaultDownPaymentPct: 0,
    paymentMode: 'amortized',
  },
  'Equipment Purchase': {
    title: 'Equipment Purchase',
    description: 'Use this to buy equipment, machines, tools, or other assets your business will use.',
    menuSubtitle: 'Buying Equipment, Machines, Or Tools',
    defaultTerm: 60,
    defaultRate: 0.07,
    defaultDownPaymentPct: 0.1,
    paymentMode: 'amortized',
  },
  'Vehicle Purchase': {
    title: 'Vehicle Purchase',
    description: 'Use this for company cars, trucks, vans, or other business vehicles.',
    menuSubtitle: 'Company Cars, Trucks, Vans, Or Work Vehicles',
    defaultTerm: 60,
    defaultRate: 0.065,
    defaultDownPaymentPct: 0.15,
    paymentMode: 'amortized',
  },
  'Inventory Purchase': {
    title: 'Inventory Purchase',
    description: 'Use this to buy inventory, raw materials, or supplies before you sell them.',
    menuSubtitle: 'Stocking Products, Supplies, Or Materials',
    defaultTerm: 12,
    defaultRate: 0.08,
    defaultDownPaymentPct: 0,
    paymentMode: 'amortized',
  },
  'Real Estate Acquisition or Development': {
    title: 'Real Estate Acquisition Or Development',
    description: 'Use this to buy, build, or improve commercial property for the business.',
    menuSubtitle: 'Buying, Building, Or Improving Business Property',
    defaultTerm: 120,
    defaultRate: 0.06,
    defaultDownPaymentPct: 0.2,
    paymentMode: 'amortized',
  },
  'Business Acquisition': {
    title: 'Business Acquisition',
    description: 'Use this to buy an existing business, buy into one, or acquire a franchise.',
    menuSubtitle: 'Buying An Existing Business Or Franchise',
    defaultTerm: 84,
    defaultRate: 0.075,
    defaultDownPaymentPct: 0.2,
    paymentMode: 'amortized',
  },
  'Unexpected Expenses': {
    title: 'Unexpected Expenses',
    description: 'Use this for emergency costs, surprise repairs, or unplanned business bills.',
    menuSubtitle: 'Emergency Costs, Repairs, Or Surprise Bills',
    defaultTerm: 36,
    defaultRate: 0.09,
    defaultDownPaymentPct: 0,
    paymentMode: 'amortized',
  },
  'Line of Credit': {
    title: 'Line Of Credit',
    description: 'Use this when you want flexible access to funds you can draw as needed.',
    menuSubtitle: 'Flexible Funds You Can Draw As Needed',
    defaultTerm: 12,
    defaultRate: 0.1,
    defaultDownPaymentPct: 0,
    paymentMode: 'interest_only',
  },
  'Debt Refinance / Consolidation': {
    title: 'Debt Refinance / Consolidation',
    description: 'Use this to roll multiple business debts into one new payment.',
    menuSubtitle: 'Rolling Multiple Debts Into One Payment',
    defaultTerm: 60,
    defaultRate: 0.075,
    defaultDownPaymentPct: 0,
    paymentMode: 'amortized',
  },
  'Business Expansion / New Location': {
    title: 'Business Expansion / New Location',
    description: 'Use this when you are growing, opening another location, or adding capacity.',
    menuSubtitle: 'Growing The Business Or Opening Another Location',
    defaultTerm: 84,
    defaultRate: 0.08,
    defaultDownPaymentPct: 0.1,
    paymentMode: 'amortized',
  },
  'Bridge Financing': {
    title: 'Bridge Financing',
    description: 'Use this for short-term funding while you wait on a sale, refinance, or longer-term loan.',
    menuSubtitle: 'Short-Term Funding Until Longer-Term Money Arrives',
    defaultTerm: 12,
    defaultRate: 0.105,
    defaultDownPaymentPct: 0,
    paymentMode: 'interest_only',
  },
  Other: {
    title: 'Other',
    description: 'Use this if your loan purpose does not fit the common options above.',
    menuSubtitle: 'A Different Loan Need Not Listed Above',
    defaultTerm: 60,
    defaultRate: 0.085,
    defaultDownPaymentPct: 0.1,
    paymentMode: 'amortized',
  },
} as const satisfies Record<string, LoanPurpose>;

export type DscrPrimaryAction = 'analysis' | 'packaging';

export interface DscrQuickStatus {
  label: string;
  badgeClassName: string;
  valueClassName: string;
  borderClassName: string;
  panelClassName: string;
  summary: string;
  lenderRead: string;
}

export interface DscrNextStepConfig {
  title: string;
  description: string;
  businessAge: string;
  businessAgeNote: string;
  creditRange: string;
  creditNote: string;
  serviceEyebrow: string;
  serviceTitle: string;
  serviceDescription: string;
  serviceSupportLine: string;
  primaryCtaLabel: string;
  primaryCtaKind: DscrPrimaryAction;
}

export interface DscrCardCopy {
  lenderOutlook: string;
  explanation: string;
  nextSteps: string;
}

export interface DscrReportCopy {
  heading: string;
  rangeLabel: string;
  lead: string;
  lenderPerspective: string;
  bullets: string[];
  bottomLine: string;
  containerClassName: string;
  accentTextClassName: string;
}

export interface DscrBandDefinition {
  id:
    | 'needs-improvement'
    | 'very-tight'
    | 'borderline'
    | 'solid-start'
    | 'strong-position'
    | 'excellent-cushion';
  minInclusive: number;
  maxExclusive?: number;
  quickStatus: DscrQuickStatus;
  nextStep: DscrNextStepConfig;
  card: DscrCardCopy;
  report: DscrReportCopy;
  showExpandedAnalysisUpsell: boolean;
}

export const DSCR_BANDS: readonly DscrBandDefinition[] = [
  {
    id: 'needs-improvement',
    minInclusive: Number.NEGATIVE_INFINITY,
    maxExclusive: 1,
    quickStatus: {
      label: 'Needs Improvement',
      badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
      valueClassName: 'text-rose-600',
      borderClassName: 'border-rose-200',
      panelClassName: 'bg-rose-50/70',
      summary:
        'This payment looks too heavy for the cash flow entered here. The business is not showing enough monthly income to support the full debt load with any real margin.',
      lenderRead:
        'Most lenders would read this as a decline-or-restructure situation unless the request gets smaller, the payment gets lower, or a fuller review shows stronger usable cash flow through valid add-backs or structure changes.',
    },
    nextStep: {
      title: 'Strengthen The File Before You Apply',
      description:
        'This request likely needs a smaller size, stronger structure, or deeper review before it looks financeable to most lenders.',
      businessAge: '2+ Years Preferred',
      businessAgeNote: 'Time in business helps, but cash flow is still the main issue at this range.',
      creditRange: 'Often 700+',
      creditNote: 'Better credit helps, but it usually will not offset a DSCR below 1.00 by itself.',
      serviceEyebrow: 'Recommended First Step',
      serviceTitle: 'Start With A Bank-Level Analysis',
      serviceDescription:
        'Before packaging the request, see how the file is likely to read to a lender and where the structure may need work.',
      serviceSupportLine:
        'Best for figuring out whether to lower the request, change the structure, or wait before applying.',
      primaryCtaLabel: 'Get My Bank-Level Analysis',
      primaryCtaKind: 'analysis',
    },
    card: {
      lenderOutlook: 'High risk as structured.',
      explanation:
        'This level usually tells a lender the business is not generating enough cash flow to comfortably cover the full debt burden being tested.',
      nextSteps:
        'Use the full cash flow analysis first, then decide whether the request needs to be reduced, restructured, or delayed.',
    },
    report: {
      heading: 'Below 1.00 (Needs Improvement)',
      rangeLabel: 'Below 1.00',
      lead: 'Your DSCR is under 1.00, which is a major warning sign for most lenders.',
      lenderPerspective:
        'This suggests the business is not currently generating enough cash flow to cover the debt load in the structure being reviewed.',
      bullets: [
        'Many lenders would pause or decline the request as structured.',
        'The deal usually needs a smaller request, lower payment, or stronger cash flow support.',
        'A deeper review may still uncover valid add-backs or structure changes worth testing.',
      ],
      bottomLine:
        'Bottom line: this is usually a restructure-first situation, not a packaging-first situation.',
      containerClassName: 'bg-red-50 border-l-4 border-red-400 text-gray-800',
      accentTextClassName: 'text-red-700',
    },
    showExpandedAnalysisUpsell: false,
  },
  {
    id: 'very-tight',
    minInclusive: 1,
    maxExclusive: 1.1,
    quickStatus: {
      label: 'Very Tight',
      badgeClassName: 'border-orange-200 bg-orange-50 text-orange-700',
      valueClassName: 'text-orange-600',
      borderClassName: 'border-orange-200',
      panelClassName: 'bg-orange-50/70',
      summary:
        'This payment is technically covered on paper, but only barely. One softer month, unexpected expense, or lender adjustment could wipe out the cushion.',
      lenderRead:
        'Most lenders would still call this tight because there is almost no room for error. This is often a range where a deeper analysis matters before you package or apply.',
    },
    nextStep: {
      title: 'Get The Structure Tighter First',
      description:
        'You may be close, but this still looks tight enough that most lenders would want a cleaner structure or stronger support.',
      businessAge: '2+ Years Preferred',
      businessAgeNote: 'A longer operating track record can help, but the request may still feel strained here.',
      creditRange: 'Often 680-720+',
      creditNote: 'Stronger credit can help, but many lenders would still want the request improved.',
      serviceEyebrow: 'Recommended First Step',
      serviceTitle: 'Use The Bank-Level Analysis First',
      serviceDescription:
        'Pressure-test the request before you spend time packaging it. This is usually the smarter move in a very tight range.',
      serviceSupportLine: 'Best for identifying what needs to change before you present the file to lenders.',
      primaryCtaLabel: 'Get My Bank-Level Analysis',
      primaryCtaKind: 'analysis',
    },
    card: {
      lenderOutlook: 'Barely supportable on a quick read.',
      explanation:
        'A lender may see mathematical coverage, but usually not enough cushion to feel comfortable without stronger support elsewhere in the file.',
      nextSteps:
        'Use the full analysis to check whether adjustments or structure changes can move the request into a more financeable zone.',
    },
    report: {
      heading: '1.00 to 1.09 (Very Tight)',
      rangeLabel: '1.00 - 1.09',
      lead: 'Your DSCR clears basic debt coverage, but the cushion is extremely thin.',
      lenderPerspective:
        'A lender can still see this as too tight because there is very little room for softer revenue, expense pressure, or underwriting adjustments.',
      bullets: [
        'Requests in this range often need a smaller amount or lower payment.',
        'Lenders usually want stronger compensating factors before moving forward.',
        'This is a good range for a bank-style review before you package anything.',
      ],
      bottomLine:
        'Bottom line: close enough to investigate, but still too tight to treat as comfortably financeable.',
      containerClassName: 'bg-orange-50 border-l-4 border-orange-400 text-gray-800',
      accentTextClassName: 'text-orange-700',
    },
    showExpandedAnalysisUpsell: true,
  },
  {
    id: 'borderline',
    minInclusive: 1.1,
    maxExclusive: 1.25,
    quickStatus: {
      label: 'Borderline',
      badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
      valueClassName: 'text-amber-600',
      borderClassName: 'border-amber-200',
      panelClassName: 'bg-amber-50/70',
      summary:
        'This request looks close to workable, but it is still tighter than most lenders prefer. The business is covering the payment, just not with a very comfortable cushion yet.',
      lenderRead:
        'A lender may see potential here, but often wants a smaller request, lower payment, or stronger overall file before feeling comfortable moving forward. This is one of the most important ranges for a lender-style review.',
    },
    nextStep: {
      title: 'You May Be Close, But Not Quite Ready',
      description:
        'There may be a workable deal here, but many lenders would still want a smaller request, stronger support, or better overall structure.',
      businessAge: '2+ Years Is Common',
      businessAgeNote: 'More operating history can make a borderline request easier to explain.',
      creditRange: 'Often 660-700+',
      creditNote: 'This is the zone where credit quality and a clean package start mattering more.',
      serviceEyebrow: 'Recommended First Step',
      serviceTitle: 'Dial In The File Before Packaging',
      serviceDescription:
        'A bank-level review can help you decide whether the request should be resized or repackaged before moving forward.',
      serviceSupportLine:
        'Best for borrowers who may be financeable, but need better structure before lender outreach.',
      primaryCtaLabel: 'Get My Bank-Level Analysis',
      primaryCtaKind: 'analysis',
    },
    card: {
      lenderOutlook: 'Promising, but still below bank comfort.',
      explanation:
        'This range can show potential, but many lenders still want more cushion than this before they feel confident about the request.',
      nextSteps:
        'Use the deeper analysis to validate the structure, then package only if the fuller lender read still holds up.',
    },
    report: {
      heading: '1.10 to 1.24 (Borderline)',
      rangeLabel: '1.10 - 1.24',
      lead: 'Your DSCR is getting closer to a comfortable lender range, but it is still below the common 1.25 benchmark.',
      lenderPerspective:
        'A lender may see a workable file here, but often wants better structure, more support, or a clearer story before feeling fully comfortable.',
      bullets: [
        'This range often triggers tighter scrutiny on credit, liquidity, and documentation.',
        'Small changes in payment structure can materially improve lender comfort here.',
        'A fuller review is often valuable before you package or apply.',
      ],
      bottomLine:
        'Bottom line: possible, but this is still a tune-the-structure range rather than an easy green light.',
      containerClassName: 'bg-amber-50 border-l-4 border-amber-400 text-gray-800',
      accentTextClassName: 'text-amber-700',
    },
    showExpandedAnalysisUpsell: true,
  },
  {
    id: 'solid-start',
    minInclusive: 1.25,
    maxExclusive: 1.4,
    quickStatus: {
      label: 'Solid Starting Point',
      badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      valueClassName: 'text-emerald-600',
      borderClassName: 'border-emerald-200',
      panelClassName: 'bg-emerald-50/80',
      summary:
        'This request looks reasonably supportable on a first pass. The business appears to have enough monthly income to cover debt and still keep a modest cushion.',
      lenderRead:
        'Many lenders would view this as a workable starting point, but they will still test the consistency of the cash flow, credit quality, tax returns, and the overall story of the file.',
    },
    nextStep: {
      title: 'You Look Close To Packaging-Ready',
      description:
        'You are above the common 1.25x benchmark, which usually means it makes sense to start organizing the file the way a lender expects to see it.',
      businessAge: '2+ Years Is Common',
      businessAgeNote: 'That track record is often enough for packaging to make sense if the rest of the file is clean.',
      creditRange: 'Often 640-680+',
      creditNote: 'Stronger bank channels may still prefer 680+, but this is a realistic starting zone.',
      serviceEyebrow: 'Recommended Next Step',
      serviceTitle: 'Start Building Your Loan Package',
      serviceDescription:
        'Turn this high-level result into a polished lender-ready file with the right documents, summaries, and story.',
      serviceSupportLine:
        'Best for businesses that look financeable and want lender-ready packaging, with brokering available if they want help approaching lenders.',
      primaryCtaLabel: 'Explore Loan Packaging Or Brokering',
      primaryCtaKind: 'packaging',
    },
    card: {
      lenderOutlook: 'A bankable starting zone.',
      explanation:
        'This usually reads as supportable on a first pass, but lenders still want the broader file, documentation quality, and business story to hold together.',
      nextSteps:
        'Package the request well, but consider validating the deeper lender view before you lean too hard on the quick result alone.',
    },
    report: {
      heading: '1.25 to 1.39 (Solid Starting Point)',
      rangeLabel: '1.25 - 1.39',
      lead: 'Your DSCR is above the common lender benchmark, which is a meaningful positive sign.',
      lenderPerspective:
        'This usually reads as a supportable payment at first glance, though lenders still care about the quality and consistency of the rest of the file.',
      bullets: [
        'This range often supports moving into packaging and lender preparation.',
        'Credit, documentation, and cash flow consistency still matter here.',
        'A deeper review can confirm whether the strength holds up in fuller underwriting.',
      ],
      bottomLine:
        'Bottom line: a credible starting point for packaging, provided the rest of the file is clean.',
      containerClassName: 'bg-emerald-50 border-l-4 border-emerald-400 text-gray-800',
      accentTextClassName: 'text-emerald-700',
    },
    showExpandedAnalysisUpsell: true,
  },
  {
    id: 'strong-position',
    minInclusive: 1.4,
    maxExclusive: 1.75,
    quickStatus: {
      label: 'Strong Position',
      badgeClassName: 'border-teal-200 bg-teal-50 text-teal-700',
      valueClassName: 'text-teal-600',
      borderClassName: 'border-teal-200',
      panelClassName: 'bg-teal-50/80',
      summary:
        'This request looks comfortably supportable based on the numbers entered. The business appears to have meaningful room above the required debt payments.',
      lenderRead:
        'A lender will often read this as a stronger repayment position, especially if the documents and business profile tell the same story. Good packaging can help that strength come through clearly.',
    },
    nextStep: {
      title: 'You Look Ready To Package This Well',
      description:
        'This is a stronger repayment position. If your credit and business history are in range, packaging the request is often the right move.',
      businessAge: '2+ Years Is Common',
      businessAgeNote: 'A solid operating history plus this DSCR usually creates a more comfortable lender conversation.',
      creditRange: 'Often 620-680+',
      creditNote: 'Stronger credit can still improve lender options, pricing, and flexibility.',
      serviceEyebrow: 'Recommended Next Step',
      serviceTitle: 'Package The File Before You Apply',
      serviceDescription:
        'A strong DSCR deserves a polished submission. We help organize the numbers, documents, and narrative the way lenders want to see them.',
      serviceSupportLine: 'Best for borrowers who look solid on paper and want lender-ready packaging, with brokering available if they want help taking it to lenders.',
      primaryCtaLabel: 'Explore Loan Packaging Or Brokering',
      primaryCtaKind: 'packaging',
    },
    card: {
      lenderOutlook: 'Strong repayment position.',
      explanation:
        'This generally tells lenders the business has comfortable room above the modeled debt service, which improves the quality of the initial read.',
      nextSteps:
        'Move into packaging, then use the full review if you want a more complete lender-facing validation before outreach.',
    },
    report: {
      heading: '1.40 to 1.74 (Strong Position)',
      rangeLabel: '1.40 - 1.74',
      lead: 'Your DSCR shows a stronger cushion above debt service, which usually improves lender comfort.',
      lenderPerspective:
        'A lender often reads this as a file with solid repayment room, assuming the tax returns, statements, and overall business profile support the same story.',
      bullets: [
        'This range tends to support a stronger first impression in underwriting.',
        'Good packaging can help that strength come through more clearly.',
        'A deeper analysis can still add confidence before you shop the request.',
      ],
      bottomLine:
        'Bottom line: this is a strong zone to package and present well.',
      containerClassName: 'bg-teal-50 border-l-4 border-teal-400 text-gray-800',
      accentTextClassName: 'text-teal-700',
    },
    showExpandedAnalysisUpsell: true,
  },
  {
    id: 'excellent-cushion',
    minInclusive: 1.75,
    quickStatus: {
      label: 'Excellent Cushion',
      badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
      valueClassName: 'text-cyan-600',
      borderClassName: 'border-cyan-200',
      panelClassName: 'bg-cyan-50/80',
      summary:
        'This request looks very comfortably supportable from a cash flow standpoint. The business appears to have a wide margin between income and required debt payments.',
      lenderRead:
        'Many lenders would see this as a strong repayment signal. It does not guarantee approval, but it can make the request easier to support when the rest of the file is clean.',
    },
    nextStep: {
      title: 'You Are In A Strong Position To Package',
      description:
        'This level of coverage gives you real room to present the request from a position of strength, assuming the rest of the file is clean.',
      businessAge: '2+ Years Still Helps',
      businessAgeNote: 'Lenders still care about operating history, but this DSCR gives you a stronger starting point.',
      creditRange: 'Often 620+; stricter banks may prefer 680+',
      creditNote: 'At this level, stronger credit can broaden your lender options more than it changes basic eligibility.',
      serviceEyebrow: 'Recommended Next Step',
      serviceTitle: 'Turn A Strong File Into A Lender-Ready Package',
      serviceDescription:
        'If the business is performing this well, the next smart move is packaging the request cleanly so the strength of the file comes through.',
      serviceSupportLine: 'Best for borrowers who appear ready and want lender-ready packaging, with brokering available if they want help carrying the file to lenders.',
      primaryCtaLabel: 'Explore Loan Packaging Or Brokering',
      primaryCtaKind: 'packaging',
    },
    card: {
      lenderOutlook: 'Excellent repayment cushion.',
      explanation:
        'This level usually reads as very comfortable debt coverage on a quick pass and can support a stronger lender conversation when the broader file is also clean.',
      nextSteps:
        'Package the request professionally so the strength of the numbers translates into a polished lender-facing file.',
    },
    report: {
      heading: '1.75 And Higher (Excellent Cushion)',
      rangeLabel: '1.75+',
      lead: 'Your DSCR shows a wide repayment cushion, which is one of the strongest quick signals a lender can see.',
      lenderPerspective:
        'At this level, the payment often looks comfortably affordable from a cash flow standpoint, assuming no other major weaknesses show up in underwriting.',
      bullets: [
        'This range can support stronger lender confidence and cleaner conversations.',
        'The file can still benefit from polished packaging and positioning.',
        'Credit, documentation quality, and structure still influence final terms and lender choice.',
      ],
      bottomLine:
        'Bottom line: a very strong quick-read position that deserves a polished lender-facing presentation.',
      containerClassName: 'bg-cyan-50 border-l-4 border-cyan-400 text-gray-800',
      accentTextClassName: 'text-cyan-700',
    },
    showExpandedAnalysisUpsell: false,
  },
] as const;

export function getDscrBand(value: number): DscrBandDefinition {
  return (
    DSCR_BANDS.find((band) => value >= band.minInclusive && (band.maxExclusive === undefined || value < band.maxExclusive)) ??
    DSCR_BANDS[DSCR_BANDS.length - 1]!
  );
}

export function calculateMonthlyLoanPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
  isInterestOnly: boolean = false,
) {
  if (!principal || !annualRate) return 0;
  const monthlyRate = annualRate / 12;

  if (isInterestOnly) {
    return principal * monthlyRate;
  }

  if (!termMonths) return 0;

  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
}

export function calculatePrincipalFromPaymentCapacity(
  monthlyPaymentCapacity: number,
  annualRate: number,
  termMonths: number,
  isInterestOnly: boolean,
) {
  if (monthlyPaymentCapacity <= 0) return 0;
  const monthlyRate = annualRate / 12;

  if (isInterestOnly) {
    if (monthlyRate <= 0) return 0;
    return monthlyPaymentCapacity / monthlyRate;
  }

  if (termMonths <= 0) return 0;
  if (monthlyRate <= 0) return monthlyPaymentCapacity * termMonths;

  const factor = (Math.pow(1 + monthlyRate, termMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, termMonths));
  return monthlyPaymentCapacity * factor;
}
