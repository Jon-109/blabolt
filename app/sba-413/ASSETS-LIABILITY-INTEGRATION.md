# 🔗 Assets-Liability Integration - Auto-Pull Debt Data

## Overview
Updated Assets sections to capture loan/debt information that will auto-populate into Liabilities section.

---

## Changes Made

### 1. ✅ Autos Section - Added Financing Checkbox

**New Checkbox:**
```
💳 I still owe money on this vehicle (auto loan or lease)
```

**When checked, shows:**
- **Current Loan Balance * ** - How much you still owe on the loan
- **Monthly Payment * ** - Your regular monthly car payment

**Benefits:**
- ✅ Clear, plain-English question
- ✅ Conditional fields (only show if checked)
- ✅ Helper text explains what to enter
- ✅ Auto-pulls into Liabilities → Installment Accounts

---

### 2. ✅ Life Insurance Section - Added Policy Loan Checkbox

**New Checkbox:**
```
💰 I borrowed money against this policy (policy loan)
```

**When checked, shows:**
- **Current Policy Loan Balance * ** - The amount you borrowed from your policy's cash value that you haven't paid back yet

**Benefits:**
- ✅ Clear explanation of what a policy loan is
- ✅ Conditional field (only show if checked)
- ✅ Detailed helper text
- ✅ Auto-pulls into Liabilities → Loans Against Life Insurance

---

### 3. ✅ Real Estate Section - Already Captures Mortgage Data

**Existing Fields (when status ≠ "Paid Off"):**
- Mortgage Lender
- Current Mortgage Balance
- Monthly Payment (PITI)

**Benefits:**
- ✅ Already implemented
- ✅ Auto-pulls into Liabilities → Mortgages on Real Estate
- ✅ No additional changes needed

---

## Visual Examples

### Autos Section - With Financing
```
┌─────────────────────────────────────┐
│ Vehicle #1                       [×] │
├─────────────────────────────────────┤
│ Year     Make        Model           │
│ [2020]   [Toyota]    [Camry]        │
│                                     │
│ Estimated Current Value             │
│ [$18,000]                           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ☑ 💳 I still owe money on this  │ │
│ │    vehicle (auto loan or lease) │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─────────────────────────────────  │
│ LOAN DETAILS                        │
│ ─────────────────────────────────  │
│                                     │
│ Current Loan Balance *              │
│ [$12,000]                           │
│ Helper: How much you still owe      │
│                                     │
│ Monthly Payment *                   │
│ [$350]                              │
│ Helper: Your regular monthly payment│
└─────────────────────────────────────┘
```

### Life Insurance - With Policy Loan
```
┌─────────────────────────────────────┐
│ Policy #1                        [×] │
├─────────────────────────────────────┤
│ Company *        Policy Type *      │
│ [State Farm]     [Whole Life ▼]     │
│                                     │
│ Face Amount *    Cash Surrender *   │
│ [$100,000]       [$25,000]          │
│                                     │
│ Beneficiary                         │
│ [Spouse]                            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ☑ 💰 I borrowed money against   │ │
│ │    this policy (policy loan)    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─────────────────────────────────  │
│ POLICY LOAN DETAILS                 │
│ ─────────────────────────────────  │
│                                     │
│ Current Policy Loan Balance *       │
│ [$5,000]                            │
│ Helper: Amount borrowed from policy │
│ cash value not yet repaid           │
└─────────────────────────────────────┘
```

---

## Type Updates

### Auto Interface
```typescript
export interface Auto {
  id: string;
  year: string;
  make: string;
  model: string;
  value: number;
  financed: boolean;
  loan_balance?: number;      // NEW
  monthly_payment?: number;   // NEW
}
```

### Life Insurance Interface
```typescript
export interface LifeInsurancePolicy {
  id: string;
  company: string;
  policy_type: string;
  policy_type_other?: string;
  face_amount: number;
  cash_surrender_value: number;
  beneficiary: string;
  loan_outstanding: boolean;
  loan_balance?: number;      // Already existed, now used
}
```

### Real Estate Interface (No Changes)
```typescript
export interface RealEstateProperty {
  // ... existing fields ...
  status: 'current' | 'late' | 'forbearance' | 'paid_off';
  mortgage_lender?: string;
  mortgage_balance?: number;
  mortgage_payment?: number;
}
```

---

## Files Modified

1. ✅ `/app/sba-413/types.ts`
   - Updated `Auto` interface (added `loan_balance`, `monthly_payment`)
   - Updated `LifeInsurancePolicy` interface (removed unused `loan_terms`)

2. ✅ `/app/sba-413/components/assets/AutosSection.tsx`
   - Added financing checkbox with emoji
   - Added conditional loan balance and monthly payment fields
   - Added section separator and helper text

3. ✅ `/app/sba-413/components/assets/StubSections.tsx`
   - Added policy loan checkbox with emoji
   - Added conditional policy loan balance field
   - Added section separator and helper text

---

## Data Flow to Liabilities

### Auto Loans → Installment Accounts
```typescript
// From Assets
const autoLoans = data.autos
  .filter(auto => auto.financed && auto.loan_balance)
  .map(auto => ({
    type: 'auto_loan',
    description: `${auto.year} ${auto.make} ${auto.model}`,
    balance: auto.loan_balance,
    monthly_payment: auto.monthly_payment
  }));
```

### Mortgages → Real Estate Mortgages
```typescript
// From Assets
const mortgages = data.real_estate
  .filter(prop => prop.status !== 'paid_off' && prop.mortgage_balance)
  .map(prop => ({
    property_address: prop.address_full,
    lender: prop.mortgage_lender,
    balance: prop.mortgage_balance,
    monthly_payment: prop.mortgage_payment
  }));
```

### Policy Loans → Loans Against Life Insurance
```typescript
// From Assets
const policyLoans = data.life_policies
  .filter(policy => policy.loan_outstanding && policy.loan_balance)
  .map(policy => ({
    company: policy.company,
    policy_type: policy.policy_type,
    loan_balance: policy.loan_balance
  }));
```

---

## User Experience Benefits

### For Users:
✅ **No duplicate entry** - Enter debt info once in Assets  
✅ **Clear questions** - Plain English with emojis  
✅ **Conditional fields** - Only see what's relevant  
✅ **Helper text** - Explains what to enter  
✅ **Auto-populated** - Liabilities section pre-filled  

### For Business:
✅ **Better data quality** - Capture at source  
✅ **Fewer errors** - No re-entry mistakes  
✅ **Faster completion** - Less work for users  
✅ **SBA compliant** - All required data captured  

---

## Testing Checklist

### Autos Section
- [ ] Add vehicle → See all fields
- [ ] Check financing box → Loan fields appear
- [ ] Uncheck financing box → Loan fields hide
- [ ] Enter loan data → Values save correctly
- [ ] Multiple vehicles → Each tracks independently

### Life Insurance Section
- [ ] Add policy → See all fields
- [ ] Check policy loan box → Loan field appears
- [ ] Uncheck policy loan box → Loan field hides
- [ ] Enter loan balance → Value saves correctly
- [ ] Multiple policies → Each tracks independently

### Real Estate Section
- [ ] Add property → See all fields
- [ ] Select "Current" status → Mortgage fields appear
- [ ] Select "Paid Off" status → Mortgage fields hide
- [ ] Enter mortgage data → Values save correctly
- [ ] Multiple properties → Each tracks independently

---

## Next Steps

1. **Create Liabilities Page** with 6 yes/no questions
2. **Auto-populate** from Assets data
3. **Add manual entry** for other debts
4. **Validation** - Ensure required fields filled
5. **Summary view** - Show all liabilities

---

*Assets-Liability Integration v1.0*  
*Smart data capture for seamless liability tracking*
