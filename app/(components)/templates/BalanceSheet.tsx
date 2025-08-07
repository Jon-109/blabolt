'use client';
import PrintShell from './shared/PrintShell';
import type { BalanceSheetData } from '@/lib/templates/types';

export default function BalanceSheet({ data }: { data: BalanceSheetData }) {
  const totalAssets =
    (data.assets.cash ?? 0) +
    (data.assets.accountsReceivable ?? 0) +
    (data.assets.inventory ?? 0) +
    (data.assets.otherCurrentAssets ?? 0) +
    (data.assets.fixedAssets ?? 0) +
    (data.assets.otherAssets ?? 0) -
    (data.assets.accumulatedDepreciation ?? 0);

  const totalLiabilities =
    (data.liabilities.accountsPayable ?? 0) +
    (data.liabilities.creditCards ?? 0) +
    (data.liabilities.shortTermLoans ?? 0) +
    (data.liabilities.longTermDebt ?? 0) +
    (data.liabilities.otherLiabilities ?? 0);

  const totalEquity = (data.equity.ownersEquity ?? 0) + (data.equity.retainedEarnings ?? 0);
  const assetsEqLiab = totalLiabilities + totalEquity;

  return (
    <PrintShell title={`Balance Sheet — As of ${data.asOfDate}`}>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Assets</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Cash</td>
                <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                  ${(data.assets.cash ?? 0).toLocaleString()}
                </td>
              </tr>
              {data.assets.accountsReceivable != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Accounts Receivable</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.accountsReceivable.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.inventory != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Inventory</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.inventory.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.otherCurrentAssets != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Other Current Assets</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.otherCurrentAssets.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.fixedAssets != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Fixed Assets</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.assets.fixedAssets.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.assets.accumulatedDepreciation != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Less: Accumulated Depreciation</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    (${data.assets.accumulatedDepreciation.toLocaleString()})
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
          <h2 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Liabilities & Equity</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {data.liabilities.accountsPayable != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Accounts Payable</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.accountsPayable.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.liabilities.creditCards != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Credit Cards</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.creditCards.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.liabilities.shortTermLoans != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Short-Term Loans</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.shortTermLoans.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.liabilities.longTermDebt != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Long-Term Debt</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.longTermDebt.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.liabilities.otherLiabilities != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Other Liabilities</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.liabilities.otherLiabilities.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '1px solid #999' }}>
                  <b>Total Liabilities</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '1px solid #999' }}>
                  <b>${totalLiabilities.toLocaleString()}</b>
                </td>
              </tr>
              {data.equity.ownersEquity != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Owner's Equity</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.equity.ownersEquity.toLocaleString()}
                  </td>
                </tr>
              )}
              {data.equity.retainedEarnings != null && (
                <tr>
                  <td style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>Retained Earnings</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    ${data.equity.retainedEarnings.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '1px solid #999' }}>
                  <b>Total Equity</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '1px solid #999' }}>
                  <b>${totalEquity.toLocaleString()}</b>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>Total Liabilities + Equity</b>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0 4px 0', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <b>${assetsEqLiab.toLocaleString()}</b>
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
