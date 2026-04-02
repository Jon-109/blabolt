"use client";

import React, { useState } from "react";
import { calculateMonthlyLoanPayment } from "@/lib/financial/dscr";


function formatCurrency(value: number) {
  return Math.round(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

type PaymentMode = "amortized" | "interest_only";

const LoanPaymentCalculatorNew: React.FC = () => {
  // Default loan amount: $25,000, term: 10 years, interest: 7.5%
  const [loanAmount, setLoanAmount] = useState<string>("25000");
  const [term, setTerm] = useState<string>("10");
  const [interestRate, setInterestRate] = useState<string>("7.5");
  const [amortization, setAmortization] = useState<string>("");
  const [downPayment, setDownPayment] = useState<string>("0");
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>("0");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("amortized");
  const [results, setResults] = useState<null | {
    monthlyPayment: number;
    totalInterest: number;
    downPaymentAmount: number;
    principal: number;
    paymentMode: PaymentMode;
    scheduleYears: number;
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
    const ratePercent = parseFloat(interestRate);
    const amort = parseInt(amortization) || n; // years
    const months = amort * 12;
    const down = parseInt(downPayment.replace(/[$,]/g, ""), 10) || 0;
    if (!principal || !n || Number.isNaN(ratePercent) || principal <= 0 || n <= 0 || ratePercent < 0) {
      setError("Please enter valid numbers for all fields.");
      return;
    }
    const downPaymentAmount = paymentMode === "interest_only" ? 0 : down > 0 ? down : 0;
    const financedPrincipal = paymentMode === "interest_only" ? principal : principal - downPaymentAmount;
    if (financedPrincipal <= 0) {
      setError("Down payment cannot be greater than or equal to loan amount.");
      return;
    }
    const payment = calculateMonthlyLoanPayment(
      financedPrincipal,
      ratePercent / 100,
      months,
      paymentMode === "interest_only",
    );
    const monthlyRate = ratePercent / 100 / 12;
    let amortizationTable = [];
    let totalInterest = 0;

    if (paymentMode === "interest_only") {
      for (let year = 1; year <= n; year++) {
        const monthsThisYear = 12;
        const interestPaid = financedPrincipal * monthlyRate * monthsThisYear;
        amortizationTable.push({
          year,
          principalPaid: 0,
          interestPaid,
          totalPaid: interestPaid,
        });
        totalInterest += interestPaid;
      }
    } else {
      let balance = financedPrincipal;
      for (let year = 1; year <= amort; year++) {
        let interestPaid = 0;
        let principalPaid = 0;
        for (let m = 1; m <= 12 && ((year - 1) * 12 + m) <= months; m++) {
          const interestForMonth = balance * monthlyRate;
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
    }

    setResults({
      monthlyPayment: Math.round(payment),
      totalInterest: Math.round(totalInterest),
      downPaymentAmount: Math.round(downPaymentAmount),
      principal: Math.round(financedPrincipal),
      paymentMode,
      scheduleYears: paymentMode === "interest_only" ? n : amort,
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
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="paymentMode">Payment Type</label>
            <select
              id="paymentMode"
              className="block w-full rounded-xl border-gray-300 pl-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg transition-colors hover:border-blue-300"
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as PaymentMode)}
            >
              <option value="amortized">Amortized</option>
              <option value="interest_only">Interest Only / LOC</option>
            </select>
            <span className="block text-xs text-gray-500 mt-1">
              Use interest-only / LOC when the monthly estimate should assume the full amount is drawn and calculate as amount x rate / 12.
            </span>
          </div>
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
              disabled={paymentMode === "interest_only"}
            />
            <span className="block text-xs text-gray-500 mt-1">
              {paymentMode === "interest_only"
                ? "Not used for interest-only / LOC monthly payment estimates."
                : "(Optional: defaults to term if blank)"}
            </span>
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
                  value={paymentMode === "interest_only" ? "0" : downPayment}
                  onChange={e => {
                    if (paymentMode === "interest_only") {
                      setDownPayment("0");
                      return;
                    }
                    // Remove all non-digits and decimals
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    const formatted = raw ? parseInt(raw, 10).toLocaleString("en-US") : "0";
                    setDownPayment(formatted);
                  }}
                  disabled={paymentMode === "interest_only"}
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
                    value={paymentMode === "interest_only" ? "0" : downPaymentPercent}
                    onChange={e => {
                      if (paymentMode === "interest_only") {
                        setDownPaymentPercent("0");
                        setDownPayment("0");
                        return;
                      }
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
                    disabled={paymentMode === "interest_only"}
                  />
                  <span className="ml-1 text-gray-600 font-semibold">%</span>
                </div>
              </div>
            </div>
            <span className="block text-xs text-gray-500 mt-1">
              {paymentMode === "interest_only"
                ? "Interest-only / LOC estimates assume the full amount is outstanding, so no down payment reduction is applied."
                : "Enter either a down payment amount or percentage. If you enter a percentage, the amount will update automatically."}
            </span>
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
                <div className="text-blue-100 text-sm">{results.paymentMode === "interest_only" ? "Full Draw Assumed" : "Down Payment"}</div>
                <div className="text-lg font-semibold">
                  {results.paymentMode === "interest_only" ? "Yes" : formatCurrency(results.downPaymentAmount)}
                </div>
              </div>
              <div>
                <div className="text-blue-100 text-sm">Principal Financed</div>
                <div className="text-lg font-semibold">{formatCurrency(results.principal)}</div>
              </div>
              <div>
                <div className="text-blue-100 text-sm">{results.paymentMode === "interest_only" ? "Payment Basis" : "Term"}</div>
                <div className="text-lg font-semibold">
                  {results.paymentMode === "interest_only" ? "Amount x rate / 12" : (amortization || term) + " years"}
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-100 opacity-80">
              {results.paymentMode === "interest_only"
                ? "This interest-only estimate assumes the full amount is drawn for the scenario entered here. Actual line utilization and lender billing may vary."
                : "This is an estimate. Actual terms, rates, and payments may vary."}
            </div>
          </div>

          {/* Amortization Schedule Table */}
          <div className="mt-8 bg-white rounded-2xl shadow-md p-6 text-gray-900 text-center">
            <h3 className="text-xl font-bold mb-4 text-blue-900">
              {results.paymentMode === "interest_only" ? "Annual Interest-Only Carry Schedule" : "Annual Amortization Schedule"}
            </h3>
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
            <div className="mt-2 text-xs text-gray-500">
              {results.paymentMode === "interest_only"
                ? `Annual breakdown over ${results.scheduleYears} year${results.scheduleYears === 1 ? "" : "s"} assuming the full amount stays drawn the whole time.`
                : "Annual breakdown: principal, interest, and total paid each year."}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LoanPaymentCalculatorNew;
