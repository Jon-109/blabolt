'use client';
import PrintShell from './shared/PrintShell';
import type { IncomeStatementData } from '@/lib/templates/types';
import { getIncomeStatementTotals } from '@/lib/templates/income-statement-calculations';

export default function IncomeStatement({ data }: { data: IncomeStatementData }) {
  const {
    cogs,
    operatingExpenses,
    interestExpense,
    totalRevenue,
    totalCogs,
    grossProfit,
    totalOperatingExpenses,
    operatingProfit,
    netProfit,
  } = getIncomeStatementTotals(data);

  return (
    <PrintShell title={`Income Statement — ${data.periodStart} to ${data.periodEnd}`}>
      {(data.statementLabel || data.statementType) ? (
        <section style={{ marginBottom: 12, fontSize: 11 }}>
          {data.statementLabel ? <div><strong>Statement Label:</strong> {data.statementLabel}</div> : null}
          {data.statementType ? <div><strong>Type:</strong> {data.statementType.toUpperCase()}</div> : null}
        </section>
      ) : null}
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
          <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Cost of Goods Sold</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {cogs.inventoryMaterialsCost != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Inventory or Materials Cost</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${cogs.inventoryMaterialsCost.toLocaleString()}
                  </td>
                </tr>
              )}
              {cogs.directLabor != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Direct Labor</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${cogs.directLabor.toLocaleString()}
                  </td>
                </tr>
              )}
              {cogs.shippingPackaging != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Shipping & Packaging</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${cogs.shippingPackaging.toLocaleString()}
                  </td>
                </tr>
              )}
              {cogs.otherDirectCosts != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Other Direct Costs</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${cogs.otherDirectCosts.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>Total Cost of Goods Sold</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>${totalCogs.toLocaleString()}</b>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold' }}>
                  <b>Gross Profit</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold' }}>
                  <b>${grossProfit.toLocaleString()}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Operating Expenses</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {operatingExpenses.payrollContractorPayments != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Payroll and Contractor Payments</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.payrollContractorPayments.toLocaleString()}
                  </td>
                </tr>
              )}
              {operatingExpenses.rentFacilityCosts != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Rent or Facility Costs</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.rentFacilityCosts.toLocaleString()}
                  </td>
                </tr>
              )}
              {operatingExpenses.utilitiesInternet != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Utilities and Internet</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.utilitiesInternet.toLocaleString()}
                  </td>
                </tr>
              )}
              {operatingExpenses.marketingAdvertising != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Marketing and Advertising</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.marketingAdvertising.toLocaleString()}
                  </td>
                </tr>
              )}
              {operatingExpenses.softwareSubscriptions != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Software and Subscriptions</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.softwareSubscriptions.toLocaleString()}
                  </td>
                </tr>
              )}
              {operatingExpenses.professionalServices != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Professional Services</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.professionalServices.toLocaleString()}
                  </td>
                </tr>
              )}
              {operatingExpenses.insurance != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Insurance</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.insurance.toLocaleString()}
                  </td>
                </tr>
              )}
              {operatingExpenses.officeAdministrative != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Office and Administrative</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.officeAdministrative.toLocaleString()}
                  </td>
                </tr>
              )}
              {operatingExpenses.vehicleTravel != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Vehicle and Travel</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.vehicleTravel.toLocaleString()}
                  </td>
                </tr>
              )}
              {operatingExpenses.otherOperatingExpenses != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Other Operating Expenses</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${operatingExpenses.otherOperatingExpenses.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>Total Operating Expenses</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>${totalOperatingExpenses.toLocaleString()}</b>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold' }}>
                  <b>Operating Profit</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold' }}>
                  <b>${operatingProfit.toLocaleString()}</b>
                </td>
              </tr>
              {interestExpense ? (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Interest Expense</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${interestExpense.toLocaleString()}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '12px 0 8px 0', fontWeight: 'bold', borderTop: '3px solid #000', fontSize: 14 }}>
                  <b>Net Profit</b>
                </td>
                <td style={{ textAlign: 'right', padding: '12px 0 8px 0', fontWeight: 'bold', borderTop: '3px solid #000', fontSize: 14, color: netProfit >= 0 ? '#059669' : '#dc2626' }}>
                  <b>${netProfit.toLocaleString()}</b>
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
