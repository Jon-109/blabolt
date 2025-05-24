"use client";

import React, { useState } from "react";


function formatCurrency(value: number) {
  return Math.round(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

const LoanPaymentCalculatorNew: React.FC = () => {
  // Default loan amount: $25,000, term: 10 years, interest: 7.5%
  const [loanAmount, setLoanAmount] = useState<string>("25000");
  const [term, setTerm] = useState<string>("10");
  const [interestRate, setInterestRate] = useState<string>("7.5");
  const [amortization, setAmortization] = useState<string>("");
  const [downPayment, setDownPayment] = useState<string>("0");
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>("0");
  const [results, setResults] = useState<null | {
    monthlyPayment: number;
    totalInterest: number;
    downPaymentAmount: number;
    principal: number;
    amortizationTable: Array<{
      year: number;
      principalPaid: number;
      interestPaid: number;
      totalPaid: number;
    }>;
  }>(null);
  const [error, setError] = useState<string>("");

  // Sync down payment amount if percent is changed
  const syncDownPaymentFromPercent = (loanAmt: string, percent: string) => {
    const principal = parseInt(loanAmt.replace(/[$,]/g, ""), 10) || 0;
    const pct = parseInt(percent, 10) || 0;
    if (principal > 0 && pct > 0) {
      return Math.round(principal * pct / 100).toLocaleString("en-US");
    }
    return "0";
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);
    // Validation
    // Only whole dollars
    const principal = parseInt(loanAmount.replace(/[$,]/g, ""), 10);
    const n = parseInt(term); // years
    const rate = parseFloat(interestRate) / 100 / 12; // monthly rate
    const amort = parseInt(amortization) || n; // years
    const months = amort * 12;
    const down = parseInt(downPayment.replace(/[$,]/g, ""), 10) || 0;
    if (!principal || !n || !rate || principal <= 0 || n <= 0 || rate < 0) {
      setError("Please enter valid numbers for all fields.");
      return;
    }
    const downPaymentAmount = down > 0 ? down : 0;
    const financedPrincipal = principal - downPaymentAmount;
    if (financedPrincipal <= 0) {
      setError("Down payment cannot be greater than or equal to loan amount.");
      return;
    }
    // Monthly payment calculation
    const payment = (financedPrincipal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    // Amortization schedule (annual summary)
    let balance = financedPrincipal;
    let amortizationTable = [];
    let totalInterest = 0;
    for (let year = 1; year <= amort; year++) {
      let interestPaid = 0;
      let principalPaid = 0;
      for (let m = 1; m <= 12 && ((year - 1) * 12 + m) <= months; m++) {
        const interestForMonth = balance * rate;
        const principalForMonth = payment - interestForMonth;
        interestPaid += interestForMonth;
        principalPaid += principalForMonth;
        balance -= principalForMonth;
        if (balance < 0) balance = 0;
      }
      amortizationTable.push({
        year,
        principalPaid,
        interestPaid,
        totalPaid: principalPaid + interestPaid
      });
      totalInterest += interestPaid;
    }
    setResults({
      monthlyPayment: Math.round(payment),
      totalInterest: Math.round(totalInterest),
      downPaymentAmount: Math.round(downPaymentAmount),
      principal: Math.round(financedPrincipal),
      amortizationTable: amortizationTable.map(row => ({
        year: row.year,
        principalPaid: Math.round(row.principalPaid),
        interestPaid: Math.round(row.interestPaid),
        totalPaid: Math.round(row.totalPaid)
      }))
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border-2 border-blue-100 p-8 md:p-12 my-8">
      <img
        src="/images/BusLendAdv_Final_4c.jpg"
        alt="Business Lender Advisor Logo"
        className="mx-auto mb-4 max-h-20 w-auto object-contain"
        style={{ maxWidth: '240px' }}
      />
      <h1 className="text-3xl font-bold text-blue-900 mb-2 text-center">Loan Payment Calculator</h1>
      <p className="text-base text-blue-800 mb-6 text-center">Calculate your estimated monthly payment for any loan scenario.</p>
      <form className="grid gap-6" onSubmit={handleCalculate} autoComplete="off">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="amount">Loan Amount ($)</label>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            pattern="[0-9,]*"
            placeholder="$25,000"
            className="block w-full rounded-xl border-gray-300 pl-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg transition-colors hover:border-blue-300"
            value={loanAmount}
            onChange={e => {
              // Remove all non-digits and decimals
              const raw = e.target.value.replace(/[^\d]/g, "");
              const formatted = raw ? parseInt(raw, 10).toLocaleString("en-US") : "";
              setLoanAmount(formatted);
            }}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="term">Term (years)</label>
            <input
              id="term"
              type="number"
              min="1"
              placeholder="10"
              className="block w-full rounded-xl border-gray-300 pl-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg transition-colors hover:border-blue-300"
              value={term}
              onChange={e => setTerm(e.target.value.replace(/[^\d]/g, ""))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="rate">Interest Rate (%)</label>
            <input
              id="rate"
              type="number"
              min="0"
              step="0.01"
              placeholder="7.5"
              className="block w-full rounded-xl border-gray-300 pl-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg transition-colors hover:border-blue-300"
              value={interestRate}
              onChange={e => setInterestRate(e.target.value.replace(/[^\d.]/g, ""))}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="amortization">Amortization (years)</label>
            <input
              id="amortization"
              type="number"
              min="1"
              placeholder="10"
              className="block w-full rounded-xl border-gray-300 pl-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg transition-colors hover:border-blue-300"
              value={amortization}
              onChange={e => setAmortization(e.target.value.replace(/[^\d]/g, ""))}
            />
            <span className="block text-xs text-gray-500 mt-1">(Optional: defaults to term if blank)</span>
          </div>
          <div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="downPayment">Down Payment Amount</label>
                <input
                  id="downPayment"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  placeholder="$0"
                  className="block w-full rounded-xl border-gray-300 pl-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg transition-colors hover:border-blue-300"
                  value={downPayment}
                  onChange={e => {
                    // Remove all non-digits and decimals
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    const formatted = raw ? parseInt(raw, 10).toLocaleString("en-US") : "0";
                    setDownPayment(formatted);
                  }}
                />
              </div>
              <div className="flex flex-col w-28">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="downPaymentPercent">Down Payment %</label>
                <div className="flex items-center">
                  <input
                    id="downPaymentPercent"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    className="block w-full rounded-xl border-gray-300 pl-3 pr-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg transition-colors hover:border-blue-300"
                    value={downPaymentPercent}
                    onChange={e => {
                      // Only whole numbers, max 100
                      let val = e.target.value.replace(/[^\d]/g, "");
                      if (val.length > 3) val = val.slice(0, 3);
                      if (parseInt(val, 10) > 100) val = "100";
                      setDownPaymentPercent(val);
                      // Only update amount if user hasn't manually set amount or clears it
                      if (val !== "" && loanAmount.replace(/[^\d]/g, "") !== "") {
                        setDownPayment(syncDownPaymentFromPercent(loanAmount, val));
                      }
                    }}
                    aria-label="Down Payment %"
                  />
                  <span className="ml-1 text-gray-600 font-semibold">%</span>
                </div>
              </div>
            </div>
            <span className="block text-xs text-gray-500 mt-1">Enter either a down payment amount or percentage. If you enter a percentage, the amount will update automatically.</span>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm text-center font-semibold">{error}</div>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700 text-white font-bold py-3 rounded-xl shadow-lg hover:from-blue-800 hover:to-blue-900 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-200 text-lg tracking-wide active:scale-95"
          style={{ letterSpacing: '0.04em' }}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-white opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Calculate Payment
          </span>
        </button>
      </form>
      {results && (
        <>
          <div className="mt-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl text-center">
            <h2 className="text-xl font-semibold mb-2">Estimated Monthly Payment</h2>
            <div className="text-4xl font-bold mb-2">{formatCurrency(results.monthlyPayment)}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-blue-100 text-sm">Total Interest Paid</div>
                <div className="text-lg font-semibold">{formatCurrency(results.totalInterest)}</div>
              </div>
              <div>
                <div className="text-blue-100 text-sm">Down Payment</div>
                <div className="text-lg font-semibold">{formatCurrency(results.downPaymentAmount)}</div>
              </div>
              <div>
                <div className="text-blue-100 text-sm">Principal Financed</div>
                <div className="text-lg font-semibold">{formatCurrency(results.principal)}</div>
              </div>
              <div>
                <div className="text-blue-100 text-sm">Term</div>
                <div className="text-lg font-semibold">{(amortization || term) + " years"}</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-100 opacity-80">
              This is an estimate. Actual terms, rates, and payments may vary.
            </div>
          </div>

          {/* Amortization Schedule Table */}
          <div className="mt-8 bg-white rounded-2xl shadow-md p-6 text-gray-900 text-center">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Annual Amortization Schedule</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Year</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider">Principal Paid</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider">Interest Paid</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {results.amortizationTable.map(row => (
                    <tr key={row.year} className="odd:bg-blue-50 even:bg-white">
                      <td className="px-4 py-2 text-left font-semibold">{row.year}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(row.principalPaid)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(row.interestPaid)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(row.totalPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-500">Annual breakdown: principal, interest, and total paid each year.</div>
          </div>
        </>
      )}
    </div>
  );
};

export default LoanPaymentCalculatorNew;
