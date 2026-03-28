'use client';
import PrintShell from './shared/PrintShell';
import type { BusinessDebtSummaryData } from '@/lib/templates/types';

const CATEGORY_LABELS: Record<string, string> = {
  credit_cards: 'Credit Cards',
  line_of_credit: 'Line of Credit',
  real_estate: 'Real Estate',
  term_loans: 'Term Loans',
  vehicle_equipment: 'Vehicle / Equipment',
  other_debt: 'Other Debt',
};

const CATEGORY_ORDER = [
  'credit_cards',
  'line_of_credit',
  'real_estate',
  'vehicle_equipment',
  'term_loans',
  'other_debt',
] as const;

const GROUPS = [
  { label: 'Revolving Debt', categories: ['credit_cards', 'line_of_credit'] },
  { label: 'Installment Debt', categories: ['term_loans', 'vehicle_equipment', 'other_debt'] },
  { label: 'Real Estate Debt', categories: ['real_estate'] },
] as const;

export default function BusinessDebtSummary({ data }: { data: BusinessDebtSummaryData }) {
  const totalOriginalAmount = data.debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
  const totalCurrentBalance = data.debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const totalMonthlyPayment = data.debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  const totalYearlyPayment = totalMonthlyPayment * 12;
  const totalLimit = data.debts.reduce((sum, debt) => sum + (debt.creditLimit || 0), 0);
  const utilization = totalLimit > 0 ? (totalCurrentBalance / totalLimit) * 100 : null;
  const categoryRows = CATEGORY_ORDER.map((category) => {
    const debts = data.debts.filter((debt) => (debt.category || 'other_debt') === category);
    const totalBalance = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalMonthlyPayment = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
    const totalLimit = debts.reduce((sum, debt) => sum + (debt.creditLimit || 0), 0);
    return {
      category,
      label: CATEGORY_LABELS[category] || 'Other Debt',
      debts,
      accounts: debts.length,
      totalBalance,
      totalMonthlyPayment,
      totalLimit,
    };
  });

  const groupRows = GROUPS.map((group) => {
    const members = categoryRows.filter((row) =>
      (group.categories as readonly string[]).includes(row.category),
    );
    const totalLimit = members.reduce((sum, row) => sum + row.totalLimit, 0);
    const utilization = group.label === 'Revolving Debt' && totalLimit > 0
      ? (members.reduce((sum, row) => sum + row.totalBalance, 0) / totalLimit) * 100
      : null;
    return {
      label: group.label,
      totalBalance: members.reduce((sum, row) => sum + row.totalBalance, 0),
      totalMonthlyPayment: members.reduce((sum, row) => sum + row.totalMonthlyPayment, 0),
      totalLimit,
      utilization,
    };
  });

  return (
    <PrintShell title={`Business Debt Summary — As of ${data.asOfDate}`}>
      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Business Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, fontSize: 11 }}>
          <div><strong>Business Name:</strong> {data.businessInfo.name}</div>
        </div>
        <div style={{ marginTop: 10, border: '1px solid #dbe3ee', borderRadius: 10, padding: 10, backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Monthly Debt Service</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>${totalMonthlyPayment.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Total Debt Exposure</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>${totalCurrentBalance.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Debt Group Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 10.5 }}>
          {groupRows.map((group) => (
            <div
              key={group.label}
              style={{
                border: '1px solid #dbe3ee',
                borderRadius: 10,
                padding: 10,
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>{group.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 9.5, color: '#64748b' }}>Total Balance</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                    ${group.totalBalance.toLocaleString()}
                  </div>
                </div>
                {group.label === 'Revolving Debt' ? (
                  <>
                    <div>
                      <div style={{ fontSize: 9.5, color: '#64748b' }}>Credit Limit</div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a' }}>
                        ${group.totalLimit.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9.5, color: '#64748b' }}>Utilization</div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e3a8a' }}>
                        {group.utilization !== null ? `${group.utilization.toFixed(1)}%` : '-'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div style={{ fontSize: 9.5, color: '#64748b' }}>Monthly Payment</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#065f46' }}>
                      ${group.totalMonthlyPayment.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Debt Detail by Category</h2>
        {data.debts.length > 0 ? (
          categoryRows.map((category) =>
            category.accounts > 0 ? (
              <div key={category.category} style={{ marginBottom: 14 }}>
                <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 700 }}>
                  {category.label} ({category.accounts})
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#334155' }}>
                        <th style={{ padding: '8px 4px', textAlign: 'left', borderBottom: '2px solid #1f2937', fontWeight: 'bold', color: '#f8fafc' }}>Description</th>
                        <th style={{ padding: '8px 4px', textAlign: 'right', borderBottom: '2px solid #1f2937', fontWeight: 'bold', color: '#f8fafc' }}>Current Balance</th>
                        <th style={{ padding: '8px 4px', textAlign: 'right', borderBottom: '2px solid #1f2937', fontWeight: 'bold', color: '#f8fafc' }}>Monthly Payment</th>
                        <th style={{ padding: '8px 4px', textAlign: 'right', borderBottom: '2px solid #1f2937', fontWeight: 'bold', color: '#f8fafc' }}>Yearly Payment</th>
                        <th style={{ padding: '8px 4px', textAlign: 'right', borderBottom: '2px solid #1f2937', fontWeight: 'bold', color: '#f8fafc' }}>Credit Limit</th>
                        <th style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '2px solid #1f2937', fontWeight: 'bold', color: '#f8fafc' }}>Guarantee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.debts.map((debt, index) => (
                        <tr key={`${category.category}-${index}`}>
                          <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{debt.creditor}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                            ${debt.currentBalance.toLocaleString()}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                            ${debt.monthlyPayment.toLocaleString()}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                            ${(debt.monthlyPayment * 12).toLocaleString()}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                            {debt.creditLimit ? `$${debt.creditLimit.toLocaleString()}` : '—'}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            {debt.personalGuarantee !== undefined ? (debt.personalGuarantee ? 'Yes' : 'No') : '—'}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <td style={{ padding: '8px 4px', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                          <b>{category.label} Total</b>
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                          <b>${category.totalBalance.toLocaleString()}</b>
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                          <b>${category.totalMonthlyPayment.toLocaleString()}</b>
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                          <b>${(category.totalMonthlyPayment * 12).toLocaleString()}</b>
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                          <b>{category.totalLimit > 0 ? `$${category.totalLimit.toLocaleString()}` : '—'}</b>
                        </td>
                        <td style={{ padding: '8px 4px', borderTop: '2px solid #333' }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null,
          )
        ) : (
          <p style={{ fontStyle: 'italic', color: '#666' }}>No debts recorded.</p>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, fontSize: 11 }}>
          <div><strong>Total Original Amount:</strong> ${totalOriginalAmount.toLocaleString()}</div>
          <div><strong>Total Balance:</strong> ${totalCurrentBalance.toLocaleString()}</div>
          <div><strong>Total Monthly:</strong> ${totalMonthlyPayment.toLocaleString()}</div>
          <div><strong>Total Yearly:</strong> ${totalYearlyPayment.toLocaleString()}</div>
          <div><strong>Total Limit:</strong> {totalLimit > 0 ? `$${totalLimit.toLocaleString()}` : '—'}</div>
          <div><strong>Utilization:</strong> {utilization !== null ? `${utilization.toFixed(1)}%` : '—'}</div>
          <div><strong>Accounts:</strong> {data.debts.length}</div>
        </div>
      </section>

      {data.notes && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 13, marginBottom: 8 }}>Notes</h3>
          <p style={{ margin: 0, lineHeight: 1.4 }}>{data.notes}</p>
        </section>
      )}
    </PrintShell>
  );
}
