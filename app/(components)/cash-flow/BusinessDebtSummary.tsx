import React from 'react';

// Local currency formatter (since @/lib/utils does not export formatCurrency)
function formatCurrency(value: number | null | undefined, digits: number = 0): string {
  return `$${(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

interface DebtDetail {
  id?: string;
  category?: string;
  lenderName?: string;
  debtType?: string;
  monthlyPayment?: number | string;
  interestRate?: number;
  outstandingBalance?: number | string;
  originalLoanAmount?: number | string;
  creditLimit?: number;
  notes?: string;
  description?: string;
}

interface DscrYearData {
  debtService?: number;
}

// Only debts (and businessName for the header) are used for all calculations and display
interface BusinessDebtSummaryProps {
  debts?: DebtDetail[] | { entries?: DebtDetail[]; annualDebtService?: Record<string, number>; annualDebtServices?: Record<string, number> };
  businessName?: string;
}

const BusinessDebtSummary: React.FC<BusinessDebtSummaryProps> = ({ debts, businessName }) => {

  // Extract summary debt fields if present (legacy, but not used in calculations)
  const debtSummaryObj = debts && typeof debts === 'object' && !Array.isArray(debts) ? debts as { annualDebtService?: Record<string, number>; annualDebtServices?: Record<string, number> } : {};
  const annualDebtService = debtSummaryObj.annualDebtService || debtSummaryObj.annualDebtServices || {};

  // Today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // --- Debt Data Preparation ---
  // Accept debts as array or object with entries[]
  const safeDebts: DebtDetail[] = Array.isArray(debts)
    ? debts
    : debts && typeof debts === 'object' && 'entries' in debts && Array.isArray((debts as any).entries)
      ? (debts as any).entries
      : [];

  // Group debts by category
  const groupedDebts: { [key: string]: DebtDetail[] } = safeDebts.reduce((acc: { [key: string]: DebtDetail[] }, debt: DebtDetail) => {
    const category = debt.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(debt);
    return acc;
  }, {});

  // Summary metrics (match CashFlowReport)
  const totalMonthlyPayment = safeDebts.reduce((sum, debt) => sum + Number(debt.monthlyPayment ?? 0), 0);
  const totalAnnualPayment = totalMonthlyPayment * 12;
  const totalCreditBalance = safeDebts
    .filter(debt => debt.category === 'CREDIT_CARD' || debt.category === 'LINE_OF_CREDIT')
    .reduce((sum, debt) => sum + Number(debt.outstandingBalance ?? 0), 0);
  const totalCreditLimit = safeDebts
    .filter(debt => debt.category === 'CREDIT_CARD' || debt.category === 'LINE_OF_CREDIT')
    .reduce((sum, debt) => sum + Number((debt as any).creditLimit ?? 0), 0);
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) : 0;
  const formatPercentage = (value: number | null | undefined, digits: number = 1): string => `${((value ?? 0) * 100).toFixed(digits)}%`;

  // Category definitions (match CashFlowReport)
  const categories = [
    { key: 'REAL_ESTATE', label: 'REAL ESTATE', columns: ['Property Address', 'Monthly Payment', 'Original Loan Amount', 'Outstanding Balance', 'Notes'] },
    { key: 'CREDIT_CARD', label: 'CREDIT CARD', columns: ['Name of Lender', 'Monthly Payment', 'Credit Limit', 'Outstanding Balance', 'Notes'] },
    { key: 'VEHICLE_EQUIPMENT', label: 'VEHICLE / EQUIPMENT', columns: ['Description', 'Monthly Payment', 'Original Loan Amount', 'Outstanding Balance', 'Notes'] },
    { key: 'LINE_OF_CREDIT', label: 'LINE OF CREDIT', columns: ['Name of Lender', 'Monthly Payment', 'Credit Limit', 'Outstanding Balance', 'Notes'] },
    { key: 'OTHER_DEBT', label: 'OTHER DEBT', columns: ['Description', 'Monthly Payment', 'Original Loan Amount', 'Outstanding Balance', 'Notes'] },
  ];

  return (
    <section
      className="w-full block bg-transparent print:m-0 print:p-0"
      style={{ width: '100%' }}
    >
      <div
        className="max-w-[720px] w-full mx-auto px-6 print:px-4 print:max-w-[720px] print:w-full print:bg-white print:mx-auto print:rounded-none print:shadow-none"
        style={{ boxSizing: 'border-box' }}
      >
      <h3 className="text-xl font-bold text-center mb-2 border-b pb-1 tracking-wide print:text-base print:pb-1 print:mb-2">BUSINESS DEBT SUMMARY</h3>
      <div className="text-center text-sm text-gray-700 mb-4 print:text-xs">
        <div><span className="font-semibold">Prepared for:</span> {businessName || '__________'}</div>
        <div><span className="font-semibold">As of:</span> {formattedDate}</div>
      </div>
      {/* --- Metrics Table --- */}
      <div className="mt-4">
        <table className="w-full border-collapse text-[11px] mb-6 print:text-[11px]">
          <thead>
            <tr className="bg-blue-50 h-7">
              <th className="border p-1 text-center text-[11px] font-bold">Monthly Debt Service</th>
              <th className="border p-1 text-center text-[11px] font-bold">Annual Debt Service</th>
              <th className="border p-1 text-center text-[11px] font-bold">Total Credit Balance</th>
              <th className="border p-1 text-center text-[11px] font-bold">Total Credit Limit</th>
              <th className="border p-1 text-center text-[11px] font-bold">Credit Utilization Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-blue-100 font-semibold h-7">
              <td className="border p-1 text-sm text-center align-middle">{formatCurrency(totalMonthlyPayment)}</td>
              <td className="border p-1 text-sm text-center align-middle">{formatCurrency(totalAnnualPayment)}</td>
              <td className="border p-1 text-sm text-center align-middle">{formatCurrency(totalCreditBalance)}</td>
              <td className="border p-1 text-sm text-center align-middle">{formatCurrency(totalCreditLimit)}</td>
              <td className="border p-1 text-sm text-center align-middle">{totalCreditLimit > 0 ? formatPercentage(creditUtilization, 1) : 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* --- Category Tables --- */}
      <div className="flex flex-col gap-6 print:gap-4">
        {categories.map(({ key, label, columns }) => {
          const debtsInCat = groupedDebts[key] || [];
          if (debtsInCat.length === 0) return null;
          return (
            <div key={key}>
              <div className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-t border border-b-0 text-xs print:text-xs">{label}</div>
              <table className="w-full border-collapse border text-xs print:text-xs">
                <colgroup>
  <col className="w-[28%]" />
  <col className="w-[16%]" />
  <col className="w-[16%]" />
  <col className="w-[16%]" />
  <col className="w-[24%]" />
</colgroup>
                <thead>
                  <tr className="bg-gray-100 h-7">
                    {columns.map((col, idx) => {
                      const centerCols = [1, 2, 3];
                      return (
                        <th
                          key={col}
                          className={`border p-0.5 font-semibold text-xs print:text-xs leading-tight ${centerCols.includes(idx) ? 'text-center' : 'text-left'}`}
                        >
                          {col === 'Monthly Payment' ? (
                            <span>Monthly<br />Payment</span>
                          ) : col === 'Original Loan Amount' ? (
                            <span>Original<br />Loan Amount</span>
                          ) : col === 'Outstanding Balance' ? (
                            <span>Outstanding<br />Balance</span>
                          ) : col}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {debtsInCat.map((debt, i) => (
                    <tr key={i} className={i % 2 ? 'bg-gray-50' : ''} style={{ height: '1.75rem' /* ~28px */ }}>
                      <td className="border p-0.5 text-xs print:text-xs leading-tight">{debt.lenderName ?? debt.description ?? debt.debtType ?? '-'}</td>
                      <td className="border p-0.5 text-center text-xs print:text-xs leading-tight">{formatCurrency(Number(debt.monthlyPayment))}</td>
                      <td className="border p-0.5 text-center text-xs print:text-xs leading-tight">{key.includes('CREDIT') ? formatCurrency(Number((debt as any).creditLimit)) : formatCurrency(Number((debt as any).originalLoanAmount))}</td>
                      <td className="border p-0.5 text-center text-xs print:text-xs leading-tight">{formatCurrency(Number(debt.outstandingBalance))}</td>
                      <td className="border p-0.5 text-xs print:text-xs leading-tight">{debt.notes ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      {/* --- Category Summary Table --- */}
      <div className="mt-6 max-w-xl mx-auto">
        <table className="w-full border-collapse text-xs print:text-xs">
          <colgroup>
            <col className="w-[42%]" />
            <col className="w-[29%]" />
            <col className="w-[29%]" />
          </colgroup>
          <thead>
            <tr className="bg-blue-100 h-7">
              <th className="border p-1 text-left font-semibold">Business Debt</th>
              <th className="border p-1 text-center align-middle font-semibold">Monthly Payment</th>
              <th className="border p-1 text-center align-middle font-semibold">Annual Payment</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(({ label, key }) => {
              const debtsInCat = groupedDebts[key] || [];
              const monthly = debtsInCat.reduce((sum, d) => sum + Number(d.monthlyPayment ?? 0), 0);
              const annual = monthly * 12;
              return (
                <tr key={key}>
                  <td className="border p-1 text-left text-xs print:text-xs">{label}</td>
                  <td className="border p-1 text-xs print:text-xs text-center align-middle">{formatCurrency(monthly)}</td>
                  <td className="border p-1 text-xs print:text-xs text-center align-middle">{formatCurrency(annual)}</td>
                </tr>
              );
            })}
            <tr className="bg-orange-100 font-bold">
              <td className="border p-1 text-left text-xs print:text-xs">Total Existing Debt:</td>
              <td className="border p-1 text-xs print:text-xs text-center align-middle font-bold">{formatCurrency(totalMonthlyPayment)}</td>
              <td className="border p-1 text-xs print:text-xs text-center align-middle font-bold">{formatCurrency(totalAnnualPayment)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </section>
  );
};

export default BusinessDebtSummary;
