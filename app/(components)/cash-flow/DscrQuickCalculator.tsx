"use client";

import React, { useState } from 'react';
import { InfoIcon } from 'lucide-react';
import { loanPurposes } from '@/lib/loanPurposes';
import Link from 'next/link';
import { Button } from '@/app/(components)/ui/button';

export interface DscrFormValues {
  monthlyNetIncome: number;
  realEstateDebt: number;
  creditCards: number;
  vehicleEquipment: number;
  linesOfCredit: number;
  otherDebt: number;
}

interface DscrQuickCalculatorProps {
  initialValues?: DscrFormValues;
  onValuesChange?: (values: DscrFormValues) => void;
}

const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const parseCurrencyInput = (value: string): number => {
  return parseInt(value.replace(/[$,]/g, '')) || 0;
};

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-block ml-2">
    <InfoIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
    <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-64 -right-2 top-6">
      <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45" />
      {text}
    </div>
  </div>
);

export const DscrGauge: React.FC<{ value: number }> = ({ value }) => {
  // Calculate rotation angle (180 degrees total range)
  // Piecewise mapping: DSCR [0,1.0] → [0°, 90°], [1.0,1.5] → [90°, 180°]
  const clamped = Math.max(0, Math.min(value, 1.5));
  let angle: number;
  if (clamped <= 1.0) {
    angle = (clamped / 1.0) * 90;
  } else {
    angle = 90 + ((clamped - 1.0) / 0.5) * 90;
  }
  
  // Determine color based on DSCR value
  let color = '#DC2626'; // Red for < 1.0
  if (value >= 1.25) color = '#16A34A'; // Green for >= 1.25
  else if (value >= 1.0) color = '#EAB308'; // Yellow for 1.0-1.24

  return (
    <div className="w-full">
      {/* DSCR Gauge Box */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 w-full">
        <h2 className="text-xl font-semibold mb-6">Your DSCR Score</h2>
        <div className="flex justify-center">
          <div className="relative w-64 h-32 mb-8">
            {/* Gauge background */}
            <div className="absolute w-full h-full rounded-t-full overflow-hidden">
              <div className="absolute inset-0 bg-gray-100" />
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 from-0% via-yellow-500 via-50% to-green-600 to-100%" />
            </div>
            
            {/* 1.25 marker line and label - updated to match other labels */}
            <div className="absolute left-[85%] top-[20px]">
              <div className="h-4 w-0.5 bg-gray-900 transform rotate-[45deg] origin-bottom" />
              <div className="absolute transform -translate-x-1/2" 
                  style={{ 
                    left: '50%', 
                    top: '-8px',
                    transform: 'rotate(45deg) translateY(-100%)'
                  }}>
                <span className="text-sm font-semibold text-gray-800 inline-block bg-yellow-100 px-1 rounded border border-yellow-400" style={{ transform: 'rotate(-45deg)' }}>
                  1.25*
                </span>
              </div>
            </div>
            
            {/* Gauge needle */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <div 
                className="relative h-[110px] w-[4px] bg-gray-900 origin-bottom transition-transform duration-500"
                style={{ transform: `rotate(${angle - 90}deg)` }}
              >
                {/* Arrow head */}
                <div 
                  className="absolute -top-1 -left-[5px] w-0 h-0 
                         border-l-[7px] border-l-transparent
                         border-b-[9px] border-b-gray-900
                         border-r-[7px] border-r-transparent"
                />
              </div>
            </div>
            
            {/* Center point */}
            <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-gray-900 rounded-full transform -translate-x-1/2 translate-y-1/2" />
            
            {/* DSCR value */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-5xl font-bold" 
                style={{ 
                  color, 
                  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
                }}>
              {value.toFixed(2)}
            </div>
            
            {/* Scale markers - moved to outside of circle */}
            <div className="absolute w-full h-full">
              {/* 0 marker on left */}
              <div className="absolute -left-6 bottom-0 transform -translate-y-1/2 text-sm font-semibold text-gray-800">
                <span>0</span>
              </div>
              
              {/* 1.0 marker on top */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 text-sm font-semibold text-gray-800">
                <span>1.0</span>
              </div>
              
              {/* 1.5+ marker on right */}
              <div className="absolute -right-8 bottom-0 transform -translate-y-1/2 text-sm font-semibold text-gray-800">
                <span>1.5+</span>
              </div>
            </div>

            {/* Range labels */}
            <div className="absolute -bottom-8 w-full grid grid-cols-3 text-center text-xs text-gray-600">
              <span className="text-red-600">High Risk</span>
              <span className="text-yellow-500">Needs Work</span>
              <span className="text-green-600">Strong</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  name: string;
  placeholder: string;
  tooltip: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}> = ({ label, name, placeholder, tooltip, value, onChange, required }) => {
  const [displayValue, setDisplayValue] = React.useState(value ? value.toLocaleString('en-US') : '');
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? value.toLocaleString('en-US') : '');
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    const numericValue = parseCurrencyInput(rawValue);
    setDisplayValue(e.target.value);
    onChange({
      ...e,
      target: {
        ...e.target,
        name,
        value: numericValue.toString()
      }
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value ? value.toString() : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(value ? value.toLocaleString('en-US') : '');
  };

  return (
    <div className="mb-4">
      <div className="flex items-center mb-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 flex-grow">
          {label}
        </label>
        <Tooltip text={tooltip} />
      </div>
      <div className="relative max-w-xs">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
        <input
          type="text"
          id={name}
          name={name}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          min={0}
          max={10000000}
          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
          inputMode="numeric"
          pattern="[0-9,]*"
        />
      </div>
    </div>
  );
};

function calculateMonthlyLoanPayment(principal: number, annualRate: number, termMonths: number) {
  if (!principal || !annualRate || !termMonths) return 0;
  const monthlyRate = annualRate / 12;
  return (
    principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)
  ) / (Math.pow(1 + monthlyRate, termMonths) - 1);
}

const DscrQuickCalculator: React.FC<DscrQuickCalculatorProps> = ({ initialValues, onValuesChange }) => {
  const [error, setError] = React.useState<string>('');
  const [values, setValues] = useState<DscrFormValues>(() => ({
    monthlyNetIncome: 0,
    realEstateDebt: 0,
    creditCards: 0,
    vehicleEquipment: 0,
    linesOfCredit: 0,
    otherDebt: 0,
    ...initialValues
  }));
  const [loanPurpose, setLoanPurpose] = useState<keyof typeof loanPurposes>('Working Capital');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  // Use a type-safe array of loan purpose keys for the dropdown
  const loanPurposeKeys = Object.keys(loanPurposes) as (keyof typeof loanPurposes)[];

  // Use a fixed interest rate for all calculations
  const FIXED_RATE = 0.075;
  const selectedPurpose = loanPurposes[loanPurpose] || loanPurposes['Working Capital'];
  const principal = parseInt(loanAmount.replace(/[$,]/g, '')) || 0;
  const estimatedPayment = principal && selectedPurpose
    ? Math.round(calculateMonthlyLoanPayment(principal, FIXED_RATE, selectedPurpose.defaultTerm))
    : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) parsed = 0;
    if (parsed > 10000000) parsed = 10000000;
    const newValues = {
      ...values,
      [name]: parsed
    };
    setValues(newValues);
    onValuesChange?.(newValues);
    setShowResults(false);
  };

  const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    let raw = e.target.value.replace(/[^\d]/g, '');
    let num = parseInt(raw) || 0;
    if (num < 0) num = 0;
    if (num > 10000000) num = 10000000;
    if (!num) {
      setLoanAmount('');
      return;
    }
    const formatted = `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    setLoanAmount(formatted);
    setShowResults(false);
  };

  const handleLoanPurposeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoanPurpose(e.target.value as keyof typeof loanPurposes);
    setShowResults(false);
  };

  const calculateDscr = () => {
    const totalMonthlyDebtPayments = 
      values.realEstateDebt +
      values.creditCards +
      values.vehicleEquipment +
      values.linesOfCredit +
      values.otherDebt;

    const totalMonthlyDebt = totalMonthlyDebtPayments + estimatedPayment;

    if (totalMonthlyDebt === 0) return null;
    if (values.monthlyNetIncome === 0) return null;
    return values.monthlyNetIncome / totalMonthlyDebt;
  };

  const handleCalculate = () => {
    setShowResults(true);
  };

  const dscr = calculateDscr();
  const annualIncome = values.monthlyNetIncome * 12;
  const totalMonthlyDebtPayments = 
    values.realEstateDebt +
    values.creditCards +
    values.vehicleEquipment +
    values.linesOfCredit +
    values.otherDebt;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
        High-Level DSCR Calculator
      </h1>
      <p className="text-gray-600 text-center mb-8 leading-relaxed">
        Use this quick calculator to estimate your Debt Service Coverage Ratio (DSCR).
        Enter your monthly net business income and the minimum monthly payments on each category of debt.
      </p>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid md:grid-cols-2 gap-x-8">
          {/* Left column: Net Income and Loan Details */}
          <div>
            <InputField
              label="Monthly Net Income"
              name="monthlyNetIncome"
              placeholder="e.g. 10,000"
              tooltip="Your business's net income per month after all expenses."
              value={values.monthlyNetIncome}
              onChange={handleInputChange}
              required
            />
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Loan Details</h2>
              <div className="mb-4">
                <label htmlFor="loanPurpose" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Loan Purpose
                  <Tooltip text="Select the purpose for your loan. This affects the loan term and interest rate." />
                </label>
                <select
                  id="loanPurpose"
                  name="loanPurpose"
                  value={loanPurpose}
                  onChange={handleLoanPurposeChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {loanPurposeKeys.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {loanPurposes[purpose]!.title}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {loanPurposes[loanPurpose]!.description}
                </div>
              </div>
              <InputField
                label="Loan Amount"
                name="loanAmount"
                placeholder="e.g. 100,000"
                tooltip="How much do you want to borrow?"
                value={parseInt(loanAmount.replace(/[$,]/g, '')) || 0}
                onChange={handleLoanAmountChange}
                required
              />
            </div>
          </div>

          {/* Right column: Debt Payments */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Minimum Monthly Debt Payments</h2>
            <div className="space-y-2">
              <InputField
                label="Real Estate Debt"
                name="realEstateDebt"
                placeholder="e.g. 2,000"
                tooltip="Monthly payments for business real estate loans."
                value={values.realEstateDebt}
                onChange={handleInputChange}
              />
              <InputField
                label="Credit Cards"
                name="creditCards"
                placeholder="e.g. 500"
                tooltip="Minimum monthly payments for all business credit cards."
                value={values.creditCards}
                onChange={handleInputChange}
              />
              <InputField
                label="Vehicle/Equipment Loans"
                name="vehicleEquipment"
                placeholder="e.g. 300"
                tooltip="Monthly payments for business vehicles or equipment."
                value={values.vehicleEquipment}
                onChange={handleInputChange}
              />
              <InputField
                label="Lines of Credit"
                name="linesOfCredit"
                placeholder="e.g. 400"
                tooltip="Monthly payments for business lines of credit."
                value={values.linesOfCredit}
                onChange={handleInputChange}
              />
              <InputField
                label="Other Debt"
                name="otherDebt"
                placeholder="e.g. 250"
                tooltip="Any other minimum monthly debt payments."
                value={values.otherDebt}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={(e) => {
              const isValid = parseInt(loanAmount.replace(/[$,]/g, '')) > 0;
              if (!isValid) {
                e.preventDefault();
                setError('Please enter a loan amount to calculate DSCR.');
                return;
              }
              setError('');
              handleCalculate();
            }}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Calculate DSCR
          </button>
          {error && (
            <div className="mt-2 text-red-600 text-sm text-center font-medium">{error}</div>
          )}
        </div>

        {showResults && dscr !== null && (
          <>
            {/* Loan Details Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm mb-8">
              <h3 className="font-semibold text-blue-700 text-lg mb-2 flex items-center">
                Loan Details
                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">For: {loanPurposes[loanPurpose]!.title}</span>
              </h3>
              <p className="text-sm text-blue-900 mb-2">Here's a breakdown of your estimated loan terms for <span className="font-semibold">{loanPurposes[loanPurpose]!.title}</span>:</p>
              <ul className="text-sm text-blue-900 space-y-1 mb-2">
                <li><span className="font-medium">Loan Amount:</span> <span className="font-mono">${parseInt(loanAmount.replace(/[$,]/g, ''))?.toLocaleString('en-US') || 0}</span></li>
                <li><span className="font-medium">Estimated Monthly Payment:</span> <span className="font-mono">${estimatedPayment ? estimatedPayment.toLocaleString('en-US') : 0}</span></li>
                <li><span className="font-medium">Term:</span> {loanPurposes[loanPurpose]!.defaultTerm} months</li>
                <li><span className="font-medium">Interest Rate:</span> 7.50% APR <span className="text-xs text-blue-700 font-semibold">(Prime Rate)</span></li>
              </ul>
              <p className="text-xs text-blue-700">These terms are typical for <span className="font-semibold">{loanPurposes[loanPurpose]!.title}</span> loans. Actual terms may vary by lender.</p>
            </div>
            {/* Main DSCR/Financial Summary grid */}
            <div className="mt-8 grid md:grid-cols-2 gap-8">
              <div className="flex flex-col h-full">
                <DscrGauge value={dscr} />
              </div>
              <div className="flex flex-col h-full">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between h-full">
                  <h2 className="text-xl font-semibold mb-2">Financial Summary</h2>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-600 text-sm">Monthly Business Income</div>
                      <div className="text-2xl font-bold leading-tight text-green-700">{formatCurrency(values.monthlyNetIncome)}</div>
                    </div>
                    <div className="mt-2">
                      <h3 className="font-semibold text-gray-700 mb-1 text-base">Monthly Debt Service</h3>
                      <div className="text-2xl font-bold leading-tight text-red-700 mb-1">{formatCurrency(totalMonthlyDebtPayments + (estimatedPayment || 0))}</div>
                      <div className="text-xs text-gray-700 ml-1">
                        <div>• Total Minimum Monthly Debt Payments: <span className="font-mono">{formatCurrency(totalMonthlyDebtPayments)}</span></div>
                        <div>• Estimated Loan Payment: <span className="font-mono">{formatCurrency(estimatedPayment || 0)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* DSCR Calculation Box - full width below the grid */}
            <div className="mt-6 bg-white rounded-lg border-2 border-blue-400 shadow p-3 flex flex-col items-center justify-center max-w-2xl mx-auto">
              <div className="font-bold text-blue-700 text-base mb-1 tracking-wide">DSCR Calculation</div>
              <div className="text-gray-800 text-[15px] font-medium mb-1">
                DSCR = <span>{formatCurrency(values.monthlyNetIncome)}</span>
                <span className="mx-1">÷</span>
                <span>{formatCurrency(totalMonthlyDebtPayments + (estimatedPayment || 0))}</span>
              </div>
              <div className="text-2xl font-extrabold text-blue-700 mt-1">= {dscr.toFixed(2)}</div>
              <div className="mt-2 text-sm text-blue-800 text-center font-medium">
                <span className="bg-yellow-100 px-2 py-1 rounded border border-yellow-400">
                  *Most banks require a minimum DSCR of 1.25 to approve a business loan. A DSCR above 1.25 means your business generates enough income to comfortably cover its debt payments.
                </span>
              </div>
            </div>
            {/* Rest of the educational/CTA boxes below, unchanged */}
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Understanding DSCR</h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  The Debt Service Coverage Ratio (DSCR) is the most critical metric banks use to evaluate small business loans. 
                  It measures your property's ability to cover its debt payments, comparing your net operating income to your total debt obligations.
                </p>
              </div>
              {/* Why Banks Care Box */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Why Banks Care About DSCR</h2>
                <ul className="text-sm text-gray-700 space-y-2.5">
                  <li>• Shows if your business generates enough income to pay its debts</li>
                  <li>• Helps predict the risk level of your loan</li>
                  <li>• Determines your interest rate and loan terms</li>
                </ul>
              </div>
            </div>
            {/* Call-to-Action Box */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-lg p-6 shadow-md border border-blue-200">
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-blue-800 mb-2">
                    Want a Bank-Level Analysis?
                  </h2>
                  <p className="text-sm text-gray-700 max-w-2xl mx-auto">
                    While this calculator provides a basic DSCR estimate, our comprehensive cash flow analysis matches the exacting standards banks use when evaluating your business.
                  </p>
                </div>
                <div className="bg-blue-100 p-5 rounded-lg mt-3 text-center border-l-4 border-blue-500">
                  <h3 className="font-semibold text-blue-800 text-lg mb-1">Comprehensive Cash Flow Analysis - $99</h3>
                  <p className="text-sm text-blue-700">Bank-Level Analysis with a Detailed PDF Report</p>
                  <Link href="/app/comprehensive-cash-flow-analysis" className="inline-block w-full max-w-xs mx-auto">
                    <Button className="mt-3 w-full" size="lg">
                      Get Started Now!
                    </Button>
                  </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <span className="w-6 h-6 bg-blue-100 rounded-full text-blue-600 flex items-center justify-center mr-2 text-xs">1</span>
                      Purpose
                    </h4>
                    <p className="text-sm text-gray-600">A professional-grade cash flow analysis designed to match the exacting standards of banks and lenders.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <span className="w-6 h-6 bg-blue-100 rounded-full text-blue-600 flex items-center justify-center mr-2 text-xs">2</span>
                      Outcome
                    </h4>
                    <p className="text-sm text-gray-600">A downloadable, lender-ready PDF report that breaks down your inflows, outflows, and key financial metrics like EBITDA and DSCR.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">


                      <span className="w-6 h-6 bg-blue-100 rounded-full text-blue-600 flex items-center justify-center mr-2 text-xs">3</span>
                      Perfect For
                    </h4>
                    <p className="text-sm text-gray-600">Businesses preparing to secure funding, apply for loans, or gain a deeper understanding of their financial health.</p>
                  </div>
                </div>
                <div className="mt-5 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="font-medium text-gray-800 mb-3 text-center">What You'll Get:</h3>
                  <ul className="text-sm text-gray-700 grid md:grid-cols-2 gap-4">
                    <li className="flex items-start bg-gray-50 p-3 rounded-lg">
                      <span className="text-green-500 mr-2 mt-0.5 text-lg">✓</span>
                      <span>2-Year + YTD Analysis (the same way banks evaluate you)</span>
                    </li>
                    <li className="flex items-start bg-gray-50 p-3 rounded-lg">
                      <span className="text-green-500 mr-2 mt-0.5 text-lg">✓</span>
                      <span>Complete Cash Flow Breakdown</span>
                    </li>
                    <li className="flex items-start bg-gray-50 p-3 rounded-lg">
                      <span className="text-green-500 mr-2 mt-0.5 text-lg">✓</span>
                      <span>DSCR Calculation Using Adjusted EBITDA</span>
                    </li>
                    <li className="flex items-start bg-gray-50 p-3 rounded-lg">
                      <span className="text-green-500 mr-2 mt-0.5 text-lg">✓</span>
                      <span>Lender-Ready PDF Report (built to impress underwriters)</span>
                    </li>
                  </ul>
                </div>

                {/* Bonus Box: Business Debt Summary */}
                <div className="w-full mt-8 rounded-2xl shadow-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 py-3 md:py-4 px-6 md:px-8 relative">
                  <span className="absolute -top-4 left-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm tracking-wide uppercase">Bonus</span>
                  <div className="pl-0 md:pl-8">
                    <h3 className="text-xl md:text-2xl font-extrabold text-purple-800 mb-1">Bonus: Lender-Ready Business Debt Summary (Auto-Filled PDF)</h3>
                    <p className="text-sm md:text-base text-gray-700 mb-4">Included free — this professional summary organizes your debts the way lenders want to see them.</p>
                    <ul className="list-none space-y-2 mb-3">
                      <li className="flex items-start text-gray-800 text-sm md:text-base"><span className="mr-2 text-purple-600">✔️</span>Auto-filled with your business debt data - no manual work</li>
                      <li className="flex items-start text-gray-800 text-sm md:text-base"><span className="mr-2 text-purple-600">✔️</span>Grouped by category to match lender expectations</li>
                      <li className="flex items-start text-gray-800 text-sm md:text-base"><span className="mr-2 text-purple-600">✔️</span>Clear layout of monthly payments and lenders — easy for underwriters to review</li>
                    </ul>
                    <div className="text-xs text-gray-500 flex justify-center mt-2">Your summary is built instantly and included in your PDF — no extra steps, no spreadsheets, no hassle.</div>
                  </div>
                </div>

                <p className="text-sm text-center text-gray-600 font-medium">
                  Walk into any bank knowing exactly how lenders will view your business.
                </p>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default DscrQuickCalculator;
