# 🎯 Liabilities Page Redesign - Progress Report

## ✅ What's Been Built

### 1. New Main Page Structure
**File:** `/app/sba-413/components/LiabilitiesPageNew.tsx`

**Features:**
- Clean yes/no question flow
- Auto-pulled debts section (from Assets)
- 6 question components
- Progress tracking
- Professional UI with gradients

---

### 2. Shared QuestionCard Component
**File:** `/app/sba-413/components/liabilities/shared/QuestionCard.tsx`

**Features:**
- ✅ Reusable yes/no question pattern
- ✅ Emoji icons for visual appeal
- ✅ Expandable details section
- ✅ Plain-English descriptions
- ✅ Examples for clarity
- ✅ Smooth animations

---

### 3. Credit Cards Question (Complete)
**File:** `/app/sba-413/components/liabilities/questions/CreditCardsQuestion.tsx`

**Captures:**
- Card Issuer
- Current Balance
- Typical Monthly Payment

**Maps to:** `credit_cards` array in LiabilitiesData

---

## 🚧 Components Still Needed

### Question Components (5 remaining)

#### 1. Student Loans Question
**File:** `/app/sba-413/components/liabilities/questions/StudentLoansQuestion.tsx`

**Should capture:**
- Lender name (e.g., Federal Direct Loan, Sallie Mae)
- Current balance
- Monthly payment (or $0 if deferred)

**Maps to:** `notes_loans` array (with type flag for student loans)

---

#### 2. Personal/Family Loans Question
**File:** `/app/sba-413/components/liabilities/questions/PersonalLoansQuestion.tsx`

**Should capture:**
- Who you owe
- Current balance
- Monthly payment

**Maps to:** `notes_loans` array

---

#### 3. Store Financing Question
**File:** `/app/sba-413/components/liabilities/questions/StoreFinancingQuestion.tsx`

**Should capture:**
- Store/Service (e.g., Affirm, Klarna)
- Total balance owed
- Monthly payment

**Maps to:** `installments_other` array

---

#### 4. Taxes Owed Question
**File:** `/app/sba-413/components/liabilities/questions/TaxesOwedQuestion.tsx`

**Should capture:**
- Type of tax (Federal / State / Property)
- Balance owed
- Monthly payment (if payment plan)

**Maps to:** `unpaid_taxes` array

---

#### 5. Other Debts Question
**File:** `/app/sba-413/components/liabilities/questions/OtherDebtsQuestion.tsx`

**Should capture:**
- Description (e.g., Child support, Medical bills)
- Balance owed
- Monthly payment

**Maps to:** `other_liabilities` array

---

### Auto-Pull Summary Components (3 needed)

#### 1. Auto Loans Summary
**File:** `/app/sba-413/components/liabilities/auto-pull/AutoLoansSummary.tsx`

**Should display:**
- List of financed vehicles from Assets
- Show: Year Make Model, Balance, Monthly Payment
- Read-only (pulled from assets.autos)

---

#### 2. Mortgages Summary
**File:** `/app/sba-413/components/liabilities/auto-pull/MortgagesSummary.tsx`

**Should display:**
- List of mortgaged properties from Assets
- Show: Address, Lender, Balance, Monthly Payment
- Read-only (pulled from assets.real_estate)

---

#### 3. Policy Loans Summary
**File:** `/app/sba-413/components/liabilities/auto-pull/PolicyLoansSummary.tsx`

**Should display:**
- List of life insurance policies with loans
- Show: Company, Policy Type, Loan Balance
- Read-only (pulled from assets.life_policies)

---

## 📋 Implementation Pattern

### For Question Components:
```typescript
'use client';

import { LiabilitiesData } from '../../../types';
import QuestionCard from '../shared/QuestionCard';
// ... other imports

export default function [Name]Question({ data, onChange, onAnswerChange }) {
  // Add/remove/update functions
  // Total calculation
  
  return (
    <QuestionCard
      icon="[emoji]"
      title="[Plain English question]"
      description="[What to include]"
      examples="[Specific examples]"
      onAnswerChange={onAnswerChange}
    >
      {/* Entry form with add/remove */}
      {/* Total display */}
    </QuestionCard>
  );
}
```

### For Auto-Pull Components:
```typescript
'use client';

export default function [Name]Summary({ [dataArray] }) {
  if ([dataArray].length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg border border-emerald-200 p-4">
      <h4 className="font-bold text-emerald-900 mb-3">
        [Icon] [Title]
      </h4>
      <div className="space-y-2">
        {[dataArray].map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>[Description]</span>
            <span className="font-semibold">[Amount]</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 Design Principles

### Question Cards:
- ✅ Large emoji icons
- ✅ Bold, plain-English titles
- ✅ Clear descriptions with examples
- ✅ Green "Yes" / Gray "No" buttons
- ✅ Expandable details section
- ✅ Add/remove functionality
- ✅ Total display with gradient

### Auto-Pull Section:
- ✅ Emerald green theme (success)
- ✅ Checkmark icon
- ✅ "Already Captured" messaging
- ✅ Read-only display
- ✅ Grouped by type

---

## 🔄 Data Flow

### From Assets → Liabilities:
```typescript
// Auto Loans
const autoLoans = assets.autos
  .filter(auto => auto.financed && auto.loan_balance);

// Mortgages
const mortgages = assets.real_estate
  .filter(prop => prop.status !== 'paid_off' && prop.mortgage_balance);

// Policy Loans
const policyLoans = assets.life_policies
  .filter(policy => policy.loan_outstanding && policy.loan_balance);
```

### User-Entered Debts:
- Credit Cards → `data.credit_cards`
- Student Loans → `data.notes_loans` (flagged)
- Personal Loans → `data.notes_loans`
- Store Financing → `data.installments_other`
- Taxes → `data.unpaid_taxes`
- Other → `data.other_liabilities`

---

## 📊 Type Updates Needed

### Add Student Loan Flag:
```typescript
export interface NoteLoan {
  id: string;
  lender_name: string;
  lender_address: string;
  original_amount: number;
  current_balance: number;
  payment_amount: number;
  payment_frequency: 'monthly' | 'quarterly' | 'annual';
  secured: boolean;
  collateral_desc?: string;
  maturity_date: string;
  status: 'current' | 'late' | 'default';
  is_student_loan?: boolean;  // NEW - to distinguish student loans
}
```

---

## 🚀 Next Steps

1. **Create remaining 5 question components** (follow CreditCardsQuestion pattern)
2. **Create 3 auto-pull summary components** (simple read-only displays)
3. **Update types.ts** (add `is_student_loan` flag)
4. **Test integration** (ensure data flows correctly)
5. **Replace old LiabilitiesPage** (swap in LiabilitiesPageNew)

---

## 📝 Files Created So Far

1. ✅ `/app/sba-413/components/LiabilitiesPageNew.tsx`
2. ✅ `/app/sba-413/components/liabilities/shared/QuestionCard.tsx`
3. ✅ `/app/sba-413/components/liabilities/questions/CreditCardsQuestion.tsx`

---

## 📝 Files Still Needed

### Questions:
4. ⏳ `StudentLoansQuestion.tsx`
5. ⏳ `PersonalLoansQuestion.tsx`
6. ⏳ `StoreFinancingQuestion.tsx`
7. ⏳ `TaxesOwedQuestion.tsx`
8. ⏳ `OtherDebtsQuestion.tsx`

### Auto-Pull:
9. ⏳ `AutoLoansSummary.tsx`
10. ⏳ `MortgagesSummary.tsx`
11. ⏳ `PolicyLoansSummary.tsx`

---

*Liabilities Redesign Progress - 3 of 11 components complete*
