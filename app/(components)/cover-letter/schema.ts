import { z } from 'zod';

// TypeScript type definition
export type CoverLetterInputs = {
  legal_name: string;
  entity_type: 'LLC' | 'S-Corp' | 'C-Corp' | 'Sole Proprietorship' | 'Partnership' | 'LLP' | 'Other';
  street_address: string;
  city: string;
  state: string;          // 2-char US
  zip: string;            // 5-digit
  year_founded: number;   // YYYY
  owners: { name: string; percent: number }[];
  origin_story?: string;
  industry: string;       // NAICS top-level / free text
  products_services: string[];      // tags
  differentiation?: string;
  loan_purpose_explained: string;
  use_of_funds: { label: string; amount: number }[]; // dollars
  impact_statement: string;
  collateral_items?: { asset_type: 'Equipment' | 'Real Estate' | 'Vehicle' | 'Inventory' | 'A/R' | 'Other'; description: string; est_value: number }[];
};

// US States for dropdown
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// Entity types
export const ENTITY_TYPES = [
  'LLC',
  'S-Corp',
  'C-Corp',
  'Sole Proprietorship',
  'Partnership',
  'LLP',
  'Other'
] as const;

// NAICS top-level industries
export const INDUSTRIES = [
  'Agriculture, Forestry, Fishing and Hunting',
  'Mining, Quarrying, and Oil and Gas Extraction',
  'Utilities',
  'Construction',
  'Manufacturing',
  'Wholesale Trade',
  'Retail Trade',
  'Transportation and Warehousing',
  'Information',
  'Finance and Insurance',
  'Real Estate and Rental and Leasing',
  'Professional, Scientific, and Technical Services',
  'Management of Companies and Enterprises',
  'Administrative and Support and Waste Management and Remediation Services',
  'Educational Services',
  'Health Care and Social Assistance',
  'Arts, Entertainment, and Recreation',
  'Accommodation and Food Services',
  'Other Services (except Public Administration)',
  'Public Administration'
];

// Asset types for collateral
export const ASSET_TYPES = [
  'Equipment',
  'Real Estate',
  'Vehicle',
  'Inventory',
  'A/R',
  'Other'
] as const;

// Zod validation schema
const ownerSchema = z.object({
  name: z.string().min(1, 'Owner name is required'),
  percent: z.number().min(0, 'Percentage must be positive').max(100, 'Percentage cannot exceed 100')
});

const useOfFundsSchema = z.object({
  label: z.string().min(1, 'Use of funds label is required'),
  amount: z.number().min(0, 'Amount must be positive')
});

const collateralItemSchema = z.object({
  asset_type: z.enum(['Equipment', 'Real Estate', 'Vehicle', 'Inventory', 'A/R', 'Other']),
  description: z.string().min(1, 'Description is required'),
  est_value: z.number().min(0, 'Estimated value must be positive')
});

export const coverLetterSchema = z.object({
  legal_name: z.string().min(1, 'Legal name is required'),
  entity_type: z.enum(['LLC', 'S-Corp', 'C-Corp', 'Sole Proprietorship', 'Partnership', 'LLP', 'Other']),
  street_address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().regex(/^\d{5}$/, 'ZIP code must be 5 digits'),
  year_founded: z.number()
    .min(1800, 'Year founded must be after 1800')
    .max(new Date().getFullYear(), 'Year founded cannot be in the future'),
  owners: z.array(ownerSchema).min(1, 'At least one owner is required'),
  origin_story: z.string().max(300, 'Origin story must be 300 characters or less').optional(),
  industry: z.string().min(1, 'Industry is required'),
  products_services: z.array(z.string()).min(1, 'At least one product/service is required'),
  differentiation: z.string().max(300, 'Differentiation must be 300 characters or less').optional(),
  loan_purpose_explained: z.string()
    .min(1, 'Loan purpose explanation is required')
    .max(400, 'Loan purpose explanation must be 400 characters or less'),
  use_of_funds: z.array(useOfFundsSchema).min(1, 'At least one use of funds is required'),
  impact_statement: z.string()
    .min(1, 'Impact statement is required')
    .max(400, 'Impact statement must be 400 characters or less'),
  collateral_items: z.array(collateralItemSchema).optional()
});

// Step-specific validation schemas
export const step1Schema = coverLetterSchema.pick({
  legal_name: true,
  entity_type: true,
  street_address: true,
  city: true,
  state: true,
  zip: true,
  year_founded: true
});

export const step2Schema = coverLetterSchema.pick({
  owners: true,
  origin_story: true,
  industry: true
});

export const step3Schema = coverLetterSchema.pick({
  products_services: true,
  differentiation: true
});

export const step4Schema = coverLetterSchema.pick({
  loan_purpose_explained: true,
  use_of_funds: true,
  impact_statement: true,
  collateral_items: true
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
