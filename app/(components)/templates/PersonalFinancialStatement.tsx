'use client';
import PrintShell from './shared/PrintShell';
import type { PersonalFinancialStatementData } from '@/lib/templates/types';

export default function PersonalFinancialStatement({ data }: { data: PersonalFinancialStatementData }) {
  const totalAssets =
    (data.assets.cashChecking ?? 0) +
    (data.assets.cashSavings ?? 0) +
    (data.assets.stocksBonds ?? 0) +
    (data.assets.realEstate ?? 0) +
    (data.assets.automobiles ?? 0) +
    (data.assets.personalProperty ?? 0) +
    (data.assets.otherAssets ?? 0);

  const totalLiabilities =
    (data.liabilities.creditCards ?? 0) +
    (data.liabilities.mortgages ?? 0) +
    (data.liabilities.autoLoans ?? 0) +
    (data.liabilities.studentLoans ?? 0) +
    (data.liabilities.otherDebts ?? 0);

  const netWorth = totalAssets - totalLiabilities;

  return (
    <PrintShell title={`Personal Financial Statement — As of ${data.asOfDate}`}>
      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Personal Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 11 }}>
          <div><strong>Name:</strong> {data.personalInfo.name}</div>
          {data.personalInfo.phone && <div><strong>Phone:</strong> {data.personalInfo.phone}</div>}
          {data.personalInfo.email && <div><strong>Email:</strong> {data.personalInfo.email}</div>}
          {data.personalInfo.address && <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {data.personalInfo.address}</div>}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Assets</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {data.assets.cashChecking != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Cash - Checking</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.cashChecking.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.cashSavings != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Cash - Savings</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.cashSavings.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.stocksBonds != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Stocks & Bonds</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.stocksBonds.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.realEstate != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Real Estate</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.realEstate.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.automobiles != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Automobiles</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.automobiles.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.personalProperty != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Personal Property</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.personalProperty.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.otherAssets != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Other Assets</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.otherAssets.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>Total Assets</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>${totalAssets.toLocaleString()}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Liabilities</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {data.liabilities.creditCards != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Credit Cards</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.creditCards.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.liabilities.mortgages != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Mortgages</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.mortgages.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.liabilities.autoLoans != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Auto Loans</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.autoLoans.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.liabilities.studentLoans != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Student Loans</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.studentLoans.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.liabilities.otherDebts != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Other Debts</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.otherDebts.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>Total Liabilities</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>${totalLiabilities.toLocaleString()}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: '400px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '12px 0 8px 0', fontWeight: 'bold', borderTop: '3px solid #000', fontSize: 14 }}>
                <b>Net Worth</b>
              </td>
              <td style={{ textAlign: 'right', padding: '12px 0 8px 0', fontWeight: 'bold', borderTop: '3px solid #000', fontSize: 14, color: netWorth >= 0 ? '#059669' : '#dc2626' }}>
                <b>${netWorth.toLocaleString()}</b>
              </td>
            </tr>
          </tbody>
        </table>
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
