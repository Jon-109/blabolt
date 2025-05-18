export interface LoanPurposeSubcategories {
  [key: string]: string;
}

export interface LoanPurpose {
  title: string;
  description: string;
  subcategories: LoanPurposeSubcategories | null;
}

export interface LoanPurposes {
  [key: string]: LoanPurpose;
}

export interface PurposeSelection {
  category: string;
  subcategory: string | null;
  custom: string | null;
}

// --- Export LoanType (add if missing) ---
export type LoanType = string; // You can refine this type as needed
