'use client';
import PrintShell from './shared/PrintShell';
import type { IncomeStatementData } from '@/lib/templates/types';

export default function IncomeStatement({ data }: { data: IncomeStatementData }) {
  const totalRevenue =
    (data.revenue.grossSales ?? 0) +
    (data.revenue.serviceRevenue ?? 0) +
    (data.revenue.otherRevenue ?? 0);

  const totalExpenses =
    (data.expenses.costOfGoodsSold ?? 0) +
    (data.expenses.salariesWages ?? 0) +
    (data.expenses.rent ?? 0) +
    (data.expenses.utilities ?? 0) +
    (data.expenses.marketing ?? 0) +
    (data.expenses.insurance ?? 0) +
    (data.expenses.depreciation ?? 0) +
    (data.expenses.interestExpense ?? 0) +
    (data.expenses.otherExpenses ?? 0);

  const netIncome = totalRevenue - totalExpenses;

  return (
    <PrintShell title={`Income Statement — ${data.periodStart} to ${data.periodEnd}`}>
      <section style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Revenue</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {data.revenue.grossSales != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Gross Sales</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.revenue.grossSales.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.revenue.serviceRevenue != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Service Revenue</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.revenue.serviceRevenue.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.revenue.otherRevenue != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Other Revenue</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.revenue.otherRevenue.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>Total Revenue</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>${totalRevenue.toLocaleString()}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Expenses</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {data.expenses.costOfGoodsSold != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Cost of Goods Sold</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.expenses.costOfGoodsSold.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.expenses.salariesWages != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Salaries & Wages</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.expenses.salariesWages.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.expenses.rent != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Rent</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.expenses.rent.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.expenses.utilities != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Utilities</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.expenses.utilities.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.expenses.marketing != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Marketing</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.expenses.marketing.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.expenses.insurance != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Insurance</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.expenses.insurance.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.expenses.depreciation != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Depreciation</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.expenses.depreciation.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.expenses.interestExpense != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Interest Expense</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.expenses.interestExpense.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.expenses.otherExpenses != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Other Expenses</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.expenses.otherExpenses.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>Total Expenses</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>${totalExpenses.toLocaleString()}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '12px 0 8px 0', fontWeight: 'bold', borderTop: '3px solid #000', fontSize: 14 }}>
                  <b>Net Income</b>
                </td>
                <td style={{ textAlign: 'right', padding: '12px 0 8px 0', fontWeight: 'bold', borderTop: '3px solid #000', fontSize: 14, color: netIncome >= 0 ? '#059669' : '#dc2626' }}>
                  <b>${netIncome.toLocaleString()}</b>
                </td>
              </tr>
            </tbody>
          </table>
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
