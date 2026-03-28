import BusinessDebtSummarySvgTemplate from '@/app/(components)/templates/BusinessDebtSummarySvgTemplate';
import type { BusinessDebtSummaryData } from '@/lib/templates/types';

type CashFlowDebtDetail = {
  category?: string;
  lenderName?: string;
  debtType?: string;
  monthlyPayment?: number | string;
  outstandingBalance?: number | string;
  originalLoanAmount?: number | string;
  creditLimit?: number | string;
  description?: string;
};

type CashFlowDebtCollection =
  | CashFlowDebtDetail[]
  | {
      entries?: CashFlowDebtDetail[];
    }
  | null
  | undefined;

type Props = {
  debts?: CashFlowDebtCollection;
  businessName?: string;
  asOfDate?: string;
  className?: string;
};

const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const parsed = Number(value.toString().replace(/[$,]/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const toTemplateCategory = (
  category?: string,
): BusinessDebtSummaryData['debts'][number]['category'] => {
  switch (category) {
    case 'CREDIT_CARD':
      return 'credit_cards';
    case 'LINE_OF_CREDIT':
      return 'line_of_credit';
    case 'REAL_ESTATE':
      return 'real_estate';
    case 'VEHICLE_EQUIPMENT':
      return 'vehicle_equipment';
    case 'TERM_LOAN':
    case 'TERM_LOANS':
      return 'term_loans';
    default:
      return 'other_debt';
  }
};

const toTemplateDate = (value?: string) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

export function buildCashFlowBusinessDebtSummaryData({
  debts,
  businessName,
  asOfDate,
}: Omit<Props, 'className'>): BusinessDebtSummaryData {
  const entries = Array.isArray(debts) ? debts : debts?.entries ?? [];

  return {
    asOfDate: toTemplateDate(asOfDate),
    businessInfo: {
      name: businessName || '',
    },
    debts: entries.map((debt) => {
      const category = toTemplateCategory(debt.category);
      const fallbackCreditLimit =
        category === 'credit_cards' || category === 'line_of_credit'
          ? toNumber(debt.creditLimit ?? debt.originalLoanAmount)
          : undefined;

      return {
        category,
        creditor: debt.lenderName || debt.description || debt.debtType || '-',
        originalAmount: toNumber(debt.originalLoanAmount ?? debt.creditLimit),
        currentBalance: toNumber(debt.outstandingBalance),
        monthlyPayment: toNumber(debt.monthlyPayment),
        creditLimit: fallbackCreditLimit,
      };
    }),
  };
}

export default function CashFlowBusinessDebtSummaryTemplate({
  debts,
  businessName,
  asOfDate,
  className,
}: Props) {
  const data = buildCashFlowBusinessDebtSummaryData({ debts, businessName, asOfDate });

  return (
    <div className={className ? `mx-auto w-full max-w-[816px] ${className}` : 'mx-auto w-full max-w-[816px]'}>
      <BusinessDebtSummarySvgTemplate data={data} />
    </div>
  );
}
