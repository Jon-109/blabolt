'use client';
import PrintShell from './shared/PrintShell';
import type { PersonalDebtSummaryData } from '@/lib/templates/types';

export default function PersonalDebtSummary({ data }: { data: PersonalDebtSummaryData }) {
  const totalOriginalAmount = data.debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
  const totalCurrentBalance = data.debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const totalMonthlyPayment = data.debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);

  return (
    <PrintShell title={`Personal Debt Summary — As of ${data.asOfDate}`}>
      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Personal Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 11 }}>
          <div><strong>Name:</strong> {data.personalInfo.name}</div>
          {data.personalInfo.ssn && <div><strong>SSN:</strong> {data.personalInfo.ssn}</div>}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Debt Summary</h2>
        {data.debts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '8px 4px', textAlign: 'left', borderBottom: '2px solid #333', fontWeight: 'bold' }}>Creditor</th>
                  <th style={{ padding: '8px 4px', textAlign: 'left', borderBottom: '2px solid #333', fontWeight: 'bold' }}>Account #</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right', borderBottom: '2px solid #333', fontWeight: 'bold' }}>Original Amount</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right', borderBottom: '2px solid #333', fontWeight: 'bold' }}>Current Balance</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right', borderBottom: '2px solid #333', fontWeight: 'bold' }}>Monthly Payment</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '2px solid #333', fontWeight: 'bold' }}>Interest Rate</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '2px solid #333', fontWeight: 'bold' }}>Maturity Date</th>
                  <th style={{ padding: '8px 4px', textAlign: 'left', borderBottom: '2px solid #333', fontWeight: 'bold' }}>Collateral</th>
                </tr>
              </thead>
              <tbody>
                {data.debts.map((debt, index) => (
                  <tr key={index}>
                    <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{debt.creditor}</td>
                    <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{debt.accountNumber || '—'}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                      ${debt.originalAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                      ${debt.currentBalance.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                      ${debt.monthlyPayment.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                      {debt.interestRate ? `${debt.interestRate}%` : '—'}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                      {debt.maturityDate || '—'}
                    </td>
                    <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{debt.collateral || '—'}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <td style={{ padding: '8px 4px', fontWeight: 'bold', borderTop: '2px solid #333' }} colSpan={2}>
                    <b>TOTALS</b>
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                    <b>${totalOriginalAmount.toLocaleString()}</b>
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                    <b>${totalCurrentBalance.toLocaleString()}</b>
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                    <b>${totalMonthlyPayment.toLocaleString()}</b>
                  </td>
                  <td style={{ padding: '8px 4px', borderTop: '2px solid #333' }} colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontStyle: 'italic', color: '#666' }}>No debts recorded.</p>
        )}
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
