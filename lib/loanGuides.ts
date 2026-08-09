export type LoanGuide = {
  slug: string;
  title: string;
  shortTitle: string;
  purpose: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  heroSummary: string;
  bestFor: string[];
  notIdealFor: string[];
  typicalUses: string[];
  lenderFocus: string[];
  process: Array<{ title: string; description: string }>;
  requiredDocuments: Array<{ title: string; description: string }>;
  declineReasons: string[];
  preparationTips: string[];
  repaymentNotes: string;
  serviceUpsell: {
    dscr: string;
    packaging: string;
    brokering: string;
  };
  faqs: Array<{ question: string; answer: string }>;
};

export const loanGuides: LoanGuide[] = [
  {
    slug: 'working-capital',
    title: 'Working Capital Loan Guide',
    shortTitle: 'Working Capital',
    purpose: 'Cover payroll, rent, vendors, receivables timing, short-term operating gaps, or seasonal cash pressure.',
    metaTitle: 'Working Capital Loan Guide: Requirements, Process, Documents, and Tips',
    metaDescription:
      'Learn how working capital loans work, what lenders review, required documents, common decline reasons, and how to prepare a stronger funding request.',
    keywords: ['working capital loan', 'business working capital', 'working capital loan requirements', 'cash flow loan'],
    heroSummary:
      'Working capital financing is usually about timing. Lenders want to understand why cash is tight, whether the need is temporary, and whether normal operations can repay the new payment without creating another cash crunch.',
    bestFor: [
      'Businesses with a clear short-term operating need',
      'Seasonal companies preparing for a busy period',
      'Owners waiting on receivables while expenses continue',
      'Companies that need operating cushion but have a believable repayment path',
    ],
    notIdealFor: [
      'Businesses using debt to cover ongoing losses with no turnaround plan',
      'Requests where the use of funds is vague or constantly changing',
      'Companies already behind on taxes, rent, or existing debt without an explanation',
    ],
    typicalUses: ['Payroll timing', 'Vendor payments', 'Rent and operating expenses', 'Seasonal inventory support', 'Receivables gaps'],
    lenderFocus: [
      'Recent bank activity and average balances',
      'Revenue trend over the last 3 to 12 months',
      'Existing debt payments and DSCR',
      'Whether the cash gap is temporary or structural',
      'Owner credit, tax status, and payment history',
    ],
    process: [
      { title: 'Define the cash-flow gap', description: 'Explain what is creating the need, how much is needed, and why the amount is not just a guess.' },
      { title: 'Review bank statements and revenue trend', description: 'Many working capital lenders focus heavily on deposits, ending balances, overdrafts, and cash movement.' },
      { title: 'Check repayment capacity', description: 'The lender estimates whether the business can handle the new payment on top of existing obligations.' },
      { title: 'Match structure to the need', description: 'Short-term needs may fit short-term loans or lines of credit. Longer recovery needs may require a more patient structure.' },
      { title: 'Package the explanation', description: 'A clean request explains what happened, how funds will be used, and how repayment will come from operations.' },
    ],
    requiredDocuments: [
      { title: 'Recent business bank statements', description: 'Usually 3 to 6 months, sometimes more if the business is seasonal.' },
      { title: 'Profit and loss statement', description: 'Shows whether the business is profitable before adding the new debt payment.' },
      { title: 'Business debt schedule', description: 'Lists current loans, advances, credit cards, balances, and monthly payments.' },
      { title: 'Tax returns or financial statements', description: 'Used to verify historical performance and normalize unusual items.' },
      { title: 'Use-of-funds summary', description: 'Explains exactly where the money will go and why the request matters now.' },
    ],
    declineReasons: [
      'Too many existing daily or weekly debt payments',
      'Recent overdrafts, negative balances, or unstable deposits',
      'No clear explanation for why the funds are needed',
      'Business is borrowing repeatedly without fixing the cash-flow issue',
      'Tax liens, unpaid payroll taxes, or unresolved legal issues',
    ],
    preparationTips: [
      'Separate temporary timing problems from ongoing profitability problems.',
      'Prepare a simple cash-flow story: what changed, what funds fix, and how repayment happens.',
      'Avoid stacking multiple short-term advances before applying for better financing.',
      'Know your current monthly debt payments before asking for more money.',
    ],
    repaymentNotes:
      'Working capital loans are often shorter term than equipment or real estate loans, so the payment can be heavier. The key question is not just whether revenue is high enough, but whether cash flow remains positive after the new payment.',
    serviceUpsell: {
      dscr: 'Start with the free cash-flow check to see whether the proposed payment looks realistic before you pursue a working capital lender.',
      packaging: 'Loan Packaging helps organize bank statements, debt schedules, financials, and the use-of-funds explanation so the request is easier to review.',
      brokering: 'Loan Brokering may help if you want lender matching instead of guessing which lenders are comfortable with your cash-flow profile.',
    },
    faqs: [
      { question: 'Is working capital financing hard to get?', answer: 'It depends on deposits, cash flow, existing debt, credit, and whether the need makes sense. Strong revenue alone is not enough if the payment burden is already too heavy.' },
      { question: 'Do lenders care more about bank statements or tax returns?', answer: 'For working capital, many lenders care heavily about recent bank statements, but stronger lenders may also review tax returns, financial statements, and debt obligations.' },
    ],
  },
  {
    slug: 'equipment-purchase',
    title: 'Equipment Financing Guide',
    shortTitle: 'Equipment Purchase',
    purpose: 'Buy machinery, tools, medical equipment, restaurant equipment, heavy equipment, or other business assets.',
    metaTitle: 'Equipment Financing Guide: Process, Documents, Requirements, and Tips',
    metaDescription:
      'Understand equipment loan requirements, lender expectations, documents needed, common approval issues, and how to prepare for equipment financing.',
    keywords: ['equipment financing', 'equipment loan requirements', 'business equipment loan', 'equipment purchase loan'],
    heroSummary:
      'Equipment financing is usually easier to explain than general working capital because the lender can see what is being purchased. The challenge is proving the equipment makes business sense and that cash flow can support the payment.',
    bestFor: [
      'Businesses buying revenue-producing or essential operating equipment',
      'Owners replacing outdated or unreliable equipment',
      'Companies adding capacity for demand they can explain',
      'Requests with quotes, invoices, or specific equipment identified',
    ],
    notIdealFor: [
      'Equipment that does not clearly support operations or revenue',
      'Very old or specialized equipment with weak resale value',
      'Businesses with no room for the new monthly payment',
    ],
    typicalUses: ['Machinery', 'Restaurant equipment', 'Construction equipment', 'Medical or dental equipment', 'Technology or production assets'],
    lenderFocus: [
      'Equipment quote, invoice, age, condition, and useful life',
      'Business cash flow and DSCR after the new payment',
      'Down payment or borrower equity in the purchase',
      'Vendor credibility and collateral value',
      'How the equipment improves capacity, efficiency, or revenue',
    ],
    process: [
      { title: 'Identify the exact equipment', description: 'Lenders want quotes, specs, vendor details, and clarity on whether costs include delivery, setup, taxes, or installation.' },
      { title: 'Estimate payment and down payment', description: 'Equipment loans are commonly structured around the asset life, collateral value, and borrower strength.' },
      { title: 'Show the business case', description: 'Explain whether the equipment replaces a failing asset, adds capacity, reduces costs, or supports new contracts.' },
      { title: 'Underwrite business and collateral', description: 'The lender reviews financials and the equipment value to determine structure and risk.' },
      { title: 'Close and fund vendor payment', description: 'Many equipment lenders pay the vendor directly after documents are signed and conditions are met.' },
    ],
    requiredDocuments: [
      { title: 'Equipment quote or invoice', description: 'Shows exact cost, vendor, model, and included expenses.' },
      { title: 'Business financial statements', description: 'Profit and loss, balance sheet, or tax returns may be used to evaluate repayment.' },
      { title: 'Business bank statements', description: 'Helps verify current activity and cash cushion.' },
      { title: 'Debt schedule', description: 'Shows existing loan and lease payments.' },
      { title: 'Business case or use-of-equipment note', description: 'Explains how the equipment supports the company.' },
    ],
    declineReasons: [
      'Equipment cost is high relative to business revenue',
      'No clear business reason for the purchase',
      'Weak collateral value or highly specialized asset',
      'Poor cash flow after adding the payment',
      'Vendor quote is incomplete or inconsistent',
    ],
    preparationTips: [
      'Get a detailed quote before applying.',
      'Explain the operational impact in plain English.',
      'Know whether you can contribute a down payment if required.',
      'Check whether the payment still works during slower months.',
    ],
    repaymentNotes:
      'Equipment loans are often amortized over several years. The payment should fit the useful life of the equipment and the expected cash-flow benefit. If the equipment does not increase revenue, reduce costs, or protect operations, lenders may be cautious.',
    serviceUpsell: {
      dscr: 'Use the free payment check before applying so you know whether the estimated equipment payment strains cash flow.',
      packaging: 'Loan Packaging can help turn quotes, financials, debt schedules, and the equipment story into a cleaner lender file.',
      brokering: 'Loan Brokering can help compare lenders that understand the equipment type, collateral value, and industry use case.',
    },
    faqs: [
      { question: 'Do I need a down payment for equipment financing?', answer: 'Sometimes. Stronger borrowers may qualify for higher advance rates, but many lenders still want some borrower equity depending on equipment type, age, and risk.' },
      { question: 'Can I finance used equipment?', answer: 'Often yes, but lenders may review age, condition, useful life, vendor credibility, and resale value more carefully.' },
    ],
  },
  {
    slug: 'business-line-of-credit',
    title: 'Business Line of Credit Guide',
    shortTitle: 'Line of Credit',
    purpose: 'Use flexible funds for recurring cash-flow timing, receivables gaps, vendor payments, inventory cycles, or seasonal needs.',
    metaTitle: 'Business Line of Credit Guide: Requirements, Process, Documents, and Tips',
    metaDescription:
      'Learn how business lines of credit work, what lenders look for, required documents, common problems, and how to prepare before applying.',
    keywords: ['business line of credit', 'revolving line of credit', 'line of credit requirements', 'business credit line'],
    heroSummary:
      'A business line of credit is meant for flexibility, not permanent rescue. Lenders want to see a repeatable cash cycle where draws can be repaid as receivables, sales, or seasonal cash come back in.',
    bestFor: [
      'Businesses with recurring timing gaps',
      'Companies that need flexibility instead of one lump-sum loan',
      'Owners managing receivables, inventory, or seasonal expenses',
      'Businesses with stable deposits and responsible debt usage',
    ],
    notIdealFor: [
      'Long-term projects that need permanent capital',
      'Businesses that will immediately max out the line with no repayment cycle',
      'Companies using a line to cover losses every month',
    ],
    typicalUses: ['Receivables timing', 'Seasonal purchases', 'Inventory cycles', 'Vendor payments', 'Payroll timing'],
    lenderFocus: [
      'Bank statement stability and average balances',
      'Accounts receivable quality if relevant',
      'Revenue consistency and seasonality',
      'Existing debt and credit utilization',
      'How draws will revolve and be repaid',
    ],
    process: [
      { title: 'Explain the cash cycle', description: 'A strong line request explains when cash goes out, when cash comes back in, and why flexibility helps.' },
      { title: 'Determine the right limit', description: 'The requested limit should tie to real operating needs, not simply the largest amount possible.' },
      { title: 'Review statements and obligations', description: 'The lender checks whether deposits, balances, and existing payments support responsible line usage.' },
      { title: 'Set structure and renewal expectations', description: 'Lines may be reviewed annually and can include interest-only payments, cleanup periods, or borrowing-base rules.' },
      { title: 'Use and repay strategically', description: 'The healthiest line usage shows draws for short-term needs and repayments when cash comes back in.' },
    ],
    requiredDocuments: [
      { title: 'Business bank statements', description: 'Shows cash movement, deposits, ending balances, and overdraft patterns.' },
      { title: 'Profit and loss statement', description: 'Helps show whether the business can support interest and eventual repayment.' },
      { title: 'Accounts receivable aging', description: 'Important when the line supports receivable timing.' },
      { title: 'Debt schedule', description: 'Shows current obligations and available payment capacity.' },
      { title: 'Use case explanation', description: 'Clarifies when draws happen and how the line gets paid down.' },
    ],
    declineReasons: [
      'Cash flow shows constant shortage instead of timing gaps',
      'Frequent overdrafts or unstable deposits',
      'Existing debt is already too heavy',
      'Requested limit is not connected to operating needs',
      'Weak repayment cycle or no plan to pay down draws',
    ],
    preparationTips: [
      'Ask for a limit tied to your real operating cycle.',
      'Prepare a clear explanation of draw timing and repayment timing.',
      'Clean up overdrafts and avoid unnecessary short-term debt stacking.',
      'Know whether interest-only payments still fit your cash flow.',
    ],
    repaymentNotes:
      'Many lines of credit have interest-only payments while balances are drawn, but that does not mean the line is free cash. Lenders still expect responsible usage, periodic paydowns, and enough cash flow to handle interest and renewal requirements.',
    serviceUpsell: {
      dscr: 'Use the free check to estimate whether interest-only line payments fit your cash flow before requesting a limit.',
      packaging: 'Loan Packaging helps organize the bank statement story, debt schedule, and line-of-credit use case for lender review.',
      brokering: 'Loan Brokering can help identify lenders that fit your industry, revenue pattern, and line usage needs.',
    },
    faqs: [
      { question: 'Is a line of credit better than a term loan?', answer: 'It depends on the need. A line is usually better for recurring short-term timing gaps. A term loan is usually better for a defined purchase or long-term project.' },
      { question: 'Can a startup get a business line of credit?', answer: 'It is harder without operating history. Some options may rely more on personal credit, collateral, or deposits, but established revenue usually helps significantly.' },
    ],
  },
  {
    slug: 'inventory-financing',
    title: 'Inventory Financing Guide',
    shortTitle: 'Inventory Purchase',
    purpose: 'Buy products, supplies, raw materials, or stock before customer payments arrive.',
    metaTitle: 'Inventory Financing Guide: Requirements, Process, Documents, and Tips',
    metaDescription:
      'Learn how inventory financing works, what lenders review, documents needed, common decline reasons, and how to prepare for inventory funding.',
    keywords: ['inventory financing', 'inventory loan', 'inventory purchase loan', 'business inventory funding'],
    heroSummary:
      'Inventory financing works best when the inventory has a clear sales path. Lenders want to know what is being bought, how quickly it sells, and whether the business can repay even if sales take longer than expected.',
    bestFor: [
      'Retail, wholesale, e-commerce, or product-based businesses',
      'Seasonal inventory builds with historical sales support',
      'Bulk purchases tied to vendor discounts or known demand',
      'Companies with organized inventory and sales records',
    ],
    notIdealFor: [
      'Slow-moving or obsolete inventory',
      'Speculative purchases without demand evidence',
      'Businesses with weak gross margins after financing costs',
    ],
    typicalUses: ['Seasonal stock', 'Bulk vendor purchases', 'Raw materials', 'Opening inventory', 'Fast-moving product replenishment'],
    lenderFocus: [
      'Inventory turnover and gross margins',
      'Purchase orders, sales history, or demand evidence',
      'Vendor terms and purchase timing',
      'Cash conversion cycle',
      'Repayment capacity if inventory sells slowly',
    ],
    process: [
      { title: 'Define what inventory is being purchased', description: 'Break out product categories, suppliers, timing, and total cost.' },
      { title: 'Show demand or historical sell-through', description: 'Lenders are more comfortable when the purchase is tied to past sales, purchase orders, or seasonal patterns.' },
      { title: 'Review margins and repayment timing', description: 'The lender wants to know whether profit remains after cost of goods, financing cost, and operating expenses.' },
      { title: 'Match term to inventory cycle', description: 'Inventory financing should not last far longer than the expected sell-through period.' },
      { title: 'Document the plan', description: 'A strong request shows what is being bought, why now, when it sells, and how proceeds repay the debt.' },
    ],
    requiredDocuments: [
      { title: 'Vendor quotes or purchase orders', description: 'Shows what is being purchased and how much it costs.' },
      { title: 'Sales reports or inventory reports', description: 'Supports turnover, demand, and product performance.' },
      { title: 'Profit and loss statement', description: 'Shows margins and operating profitability.' },
      { title: 'Bank statements', description: 'Verifies cash movement and current liquidity.' },
      { title: 'Debt schedule', description: 'Shows existing obligations that compete with repayment.' },
    ],
    declineReasons: [
      'Inventory is speculative or slow moving',
      'Margins are too thin after financing costs',
      'No clear sales history or demand evidence',
      'Requested term does not match inventory cycle',
      'Business already has too much short-term debt',
    ],
    preparationTips: [
      'Know your gross margin by product category.',
      'Prepare sales history for the same or similar inventory.',
      'Avoid borrowing more than the realistic sell-through supports.',
      'Explain the timing: why this inventory, why now, and when it converts to cash.',
    ],
    repaymentNotes:
      'Inventory loans often need shorter repayment structures because the asset should convert back into cash. If the inventory takes six months to sell, a very short repayment schedule may pressure cash flow even if the product is profitable.',
    serviceUpsell: {
      dscr: 'Use the free cash-flow check to see whether the expected payment fits before buying inventory with debt.',
      packaging: 'Loan Packaging helps connect vendor quotes, sales history, inventory needs, and financials into one lender-ready explanation.',
      brokering: 'Loan Brokering can help if your inventory cycle needs a lender comfortable with seasonality, product margins, or e-commerce revenue patterns.',
    },
    faqs: [
      { question: 'Can inventory be used as collateral?', answer: 'Sometimes, but lenders may discount its value heavily because inventory can be hard to liquidate, age quickly, or depend on demand.' },
      { question: 'What makes an inventory request stronger?', answer: 'Strong sales history, healthy margins, clear vendor costs, fast turnover, and a repayment schedule that matches the inventory cycle.' },
    ],
  },
  {
    slug: 'business-acquisition',
    title: 'Business Acquisition Loan Guide',
    shortTitle: 'Business Acquisition',
    purpose: 'Buy an existing business, acquire ownership, or finance a purchase transaction.',
    metaTitle: 'Business Acquisition Loan Guide: SBA Process, Documents, Requirements, and Tips',
    metaDescription:
      'Understand business acquisition financing, lender expectations, required documents, common decline reasons, and how to prepare a stronger acquisition loan package.',
    keywords: ['business acquisition loan', 'buy a business loan', 'SBA acquisition loan', 'business purchase financing'],
    heroSummary:
      'Acquisition financing is more complex because lenders evaluate both the buyer and the business being purchased. The deal has to make sense financially, operationally, and structurally.',
    bestFor: [
      'Buyers with a specific target business identified',
      'Transactions with financial records and seller cooperation',
      'Experienced operators or buyers with relevant management support',
      'Deals where cash flow can support debt after owner compensation and transition costs',
    ],
    notIdealFor: [
      'Businesses with unreliable financial records',
      'Overpriced deals with weak cash flow',
      'Buyers with no plan for transition, operations, or equity injection',
    ],
    typicalUses: ['Purchase price', 'Closing costs', 'Working capital after closing', 'Seller note refinance', 'Transition expenses'],
    lenderFocus: [
      'Historical cash flow of the target business',
      'Purchase price support and valuation reasonableness',
      'Buyer experience, credit, and liquidity',
      'Seller transition plan',
      'Debt service coverage after acquisition debt',
    ],
    process: [
      { title: 'Gather target business financials', description: 'The lender needs tax returns, profit and loss statements, balance sheets, and add-back support.' },
      { title: 'Review valuation and deal structure', description: 'Purchase price, seller note, down payment, working capital, and closing costs all affect approval strength.' },
      { title: 'Analyze buyer strength', description: 'Experience, credit, liquidity, and management plan matter because the buyer must operate the business after closing.' },
      { title: 'Underwrite cash flow and transition risk', description: 'The lender checks whether normalized cash flow supports acquisition debt and whether revenue is likely to continue.' },
      { title: 'Close with conditions', description: 'Acquisition loans often involve due diligence, landlord approvals, franchise approvals, life insurance, or SBA conditions.' },
    ],
    requiredDocuments: [
      { title: 'Target business tax returns and financials', description: 'Usually 3 years when available, plus year-to-date financials.' },
      { title: 'Purchase agreement or letter of intent', description: 'Shows price, terms, deposit, seller note, and transaction structure.' },
      { title: 'Buyer personal financial statement', description: 'Shows liquidity, net worth, debts, and guarantor strength.' },
      { title: 'Resume or management background', description: 'Explains why the buyer can operate the business.' },
      { title: 'Debt schedule and add-back support', description: 'Helps normalize cash flow and validate seller discretionary earnings.' },
    ],
    declineReasons: [
      'Purchase price is too high for verified cash flow',
      'Seller financials are incomplete or unreliable',
      'Buyer lacks experience or liquidity',
      'Transition plan is weak or key employees/customers may leave',
      'Too much seller add-back is unsupported',
    ],
    preparationTips: [
      'Do not rely on seller claims without documentation.',
      'Build a clean sources-and-uses table for the transaction.',
      'Separate verified cash flow from optimistic projections.',
      'Prepare a realistic transition plan before underwriting questions start.',
    ],
    repaymentNotes:
      'Acquisition lenders focus on historical cash flow and post-close debt service. If the deal only works under aggressive growth assumptions, it may be hard to finance. The safer story is that existing cash flow can support the loan before upside is counted.',
    serviceUpsell: {
      dscr: 'Use the free payment check as an early screen, but acquisition deals usually need deeper cash-flow review because add-backs and buyer compensation matter.',
      packaging: 'Loan Packaging is especially useful for acquisition requests because documents, transaction structure, buyer story, and cash-flow support must stay consistent.',
      brokering: 'Loan Brokering can help position the transaction and approach lenders that understand acquisition financing, SBA structure, and seller-note issues.',
    },
    faqs: [
      { question: 'Can I get a loan to buy a business with little money down?', answer: 'Some structures allow seller notes or partial financing, but lenders usually expect buyer equity, liquidity, and a deal that cash flows at the proposed debt level.' },
      { question: 'Do projections matter for acquisition financing?', answer: 'They can help, but lenders usually rely more on verified historical cash flow than optimistic post-close projections.' },
    ],
  },
  {
    slug: 'commercial-real-estate-purchase',
    title: 'Commercial Real Estate Purchase Loan Guide',
    shortTitle: 'Commercial Real Estate Purchase',
    purpose: 'Buy owner-occupied commercial property, business facilities, office, warehouse, retail, or mixed-use business space.',
    metaTitle: 'Commercial Real Estate Loan Guide: Requirements, Process, Documents, and Tips',
    metaDescription:
      'Learn commercial real estate loan requirements, underwriting factors, documents needed, common decline reasons, and how to prepare before buying property.',
    keywords: ['commercial real estate loan', 'owner occupied commercial mortgage', 'SBA 504 loan', 'commercial property financing'],
    heroSummary:
      'Commercial real estate financing is part property loan and part business loan. Lenders review the property, the business that will occupy or repay it, collateral value, down payment, and long-term repayment strength.',
    bestFor: [
      'Businesses buying property they will occupy or use',
      'Owners replacing rent with ownership when cash flow supports it',
      'Companies with stable financials and a defined property under contract',
      'Borrowers prepared for appraisal, environmental, and closing due diligence',
    ],
    notIdealFor: [
      'Properties with unresolved environmental or title problems',
      'Deals with insufficient down payment or weak appraised value',
      'Businesses whose cash flow cannot support the mortgage plus operating costs',
    ],
    typicalUses: ['Property purchase', 'Closing costs', 'Tenant improvements', 'Reserves', 'Owner-occupied business facilities'],
    lenderFocus: [
      'Business cash flow and DSCR',
      'Property value, condition, and appraisal',
      'Down payment and borrower liquidity',
      'Occupancy, lease economics, or rent replacement logic',
      'Environmental, zoning, title, and insurance issues',
    ],
    process: [
      { title: 'Define the property and purchase terms', description: 'The lender needs address, purchase price, contract terms, occupancy plan, and intended use.' },
      { title: 'Analyze business repayment capacity', description: 'Even with property collateral, the lender wants the business to comfortably support payments.' },
      { title: 'Order third-party reports', description: 'Appraisal, environmental review, title, insurance, and sometimes property condition reports may be required.' },
      { title: 'Structure down payment and reserves', description: 'Real estate loans often require meaningful borrower equity and post-close liquidity.' },
      { title: 'Close after due diligence', description: 'Closing depends on underwriting, property reports, entity documents, insurance, and any SBA or lender-specific conditions.' },
    ],
    requiredDocuments: [
      { title: 'Purchase contract', description: 'Shows price, deadlines, contingencies, and property details.' },
      { title: 'Business tax returns and financials', description: 'Used to verify repayment capacity.' },
      { title: 'Rent roll or lease information', description: 'Relevant if any third-party tenants are involved.' },
      { title: 'Personal financial statement', description: 'Shows guarantor liquidity and ability to contribute down payment.' },
      { title: 'Property information', description: 'Address, use, square footage, photos, insurance, and available property records.' },
    ],
    declineReasons: [
      'Appraisal comes in too low',
      'Business cash flow does not support the payment',
      'Environmental or property condition issues',
      'Insufficient down payment or post-close liquidity',
      'Property use does not fit lender or SBA requirements',
    ],
    preparationTips: [
      'Estimate the full cost, not just the purchase price.',
      'Account for taxes, insurance, repairs, buildout, and reserves.',
      'Prepare financials before the contract deadline pressure starts.',
      'Understand whether the property is owner-occupied enough for the desired program.',
    ],
    repaymentNotes:
      'Commercial real estate loans often have longer amortization, which can reduce monthly payment pressure. But lenders still test whether business cash flow supports the mortgage, property expenses, existing debt, and a cushion.',
    serviceUpsell: {
      dscr: 'Use the payment check to estimate whether the proposed mortgage payment is comfortable before spending time and money on due diligence.',
      packaging: 'Loan Packaging helps organize financials, property details, debt schedules, and the purchase story into a coherent lender file.',
      brokering: 'Loan Brokering can help route the request to lenders that fit owner-occupied real estate, SBA, conventional, or property-specific requirements.',
    },
    faqs: [
      { question: 'How much down payment is needed for commercial real estate?', answer: 'It varies by lender, program, property, and borrower strength. Many deals require meaningful equity, and SBA structures may differ from conventional commercial mortgages.' },
      { question: 'Does the property or business matter more?', answer: 'Both matter. Strong collateral helps, but lenders usually still need the business or property income to support repayment.' },
    ],
  },
  {
    slug: 'debt-refinance-consolidation',
    title: 'Business Debt Refinance and Consolidation Guide',
    shortTitle: 'Debt Refinance',
    purpose: 'Refinance expensive loans, consolidate multiple payments, improve terms, or reduce payment pressure.',
    metaTitle: 'Business Debt Refinance Guide: Consolidation Process, Documents, and Tips',
    metaDescription:
      'Learn how business debt refinance and consolidation work, what lenders review, documents needed, decline reasons, and how to prepare.',
    keywords: ['business debt consolidation', 'business debt refinance', 'refinance business loan', 'consolidate business debt'],
    heroSummary:
      'Debt refinance is strongest when the new loan clearly improves the business. Lenders want to see that consolidation lowers payment pressure, improves cash flow, or replaces risky debt with a healthier structure.',
    bestFor: [
      'Businesses with multiple debts that create payment pressure',
      'Owners refinancing short-term debt into a more manageable structure',
      'Companies with stable revenue but messy debt schedules',
      'Borrowers who can show improvement after consolidation',
    ],
    notIdealFor: [
      'Businesses trying to refinance debt they recently stacked without a plan',
      'Requests where new debt does not actually improve cash flow',
      'Companies with unresolved defaults, liens, or unpaid taxes',
    ],
    typicalUses: ['Loan payoff', 'Merchant cash advance consolidation', 'Credit card consolidation', 'Maturity refinance', 'Payment reduction'],
    lenderFocus: [
      'Current debt balances, payments, and payoff letters',
      'Cash-flow improvement after refinance',
      'Payment history on existing obligations',
      'Reason the debt built up',
      'DSCR before and after consolidation',
    ],
    process: [
      { title: 'Build the current debt schedule', description: 'List every lender, balance, payment, rate if known, maturity, and payoff requirement.' },
      { title: 'Calculate the improvement', description: 'The lender wants to see whether the new structure lowers monthly payments or reduces risk.' },
      { title: 'Explain why debt exists', description: 'A strong refinance request explains what caused the debt and why the business will be healthier after consolidation.' },
      { title: 'Verify payoffs and lien positions', description: 'The lender may need payoff letters, UCC searches, lien releases, or tax status checks.' },
      { title: 'Close and pay creditors', description: 'Refinance proceeds often go directly to existing creditors instead of the borrower.' },
    ],
    requiredDocuments: [
      { title: 'Business debt schedule', description: 'The most important document for refinance requests.' },
      { title: 'Payoff letters or statements', description: 'Shows accurate balances and payoff instructions.' },
      { title: 'Bank statements', description: 'Shows current cash activity and debt payment pressure.' },
      { title: 'Financial statements or tax returns', description: 'Verifies ability to support the new structure.' },
      { title: 'Use-of-funds and improvement summary', description: 'Shows what will be paid off and what improves after closing.' },
    ],
    declineReasons: [
      'New loan does not materially improve cash flow',
      'Debt balances or payments are unclear',
      'Recent stacking signals higher risk',
      'Existing lenders have liens that complicate payoff',
      'Business cannot support even the improved payment',
    ],
    preparationTips: [
      'Create a complete debt schedule before talking to lenders.',
      'Calculate monthly payment before and after refinance.',
      'Get payoff statements early when possible.',
      'Explain the root cause of the debt instead of pretending it does not matter.',
    ],
    repaymentNotes:
      'The best refinance structure gives the business breathing room without simply extending a problem. Lenders usually want to see a clear DSCR or monthly cash-flow improvement after the old payments are replaced.',
    serviceUpsell: {
      dscr: 'Use the free check to compare whether the proposed refinance payment improves cash-flow coverage.',
      packaging: 'Loan Packaging helps organize debt schedules, payoff documents, financials, and the refinance story into one clear request.',
      brokering: 'Loan Brokering can help find lenders comfortable with consolidation, payoff complexity, and existing lien situations.',
    },
    faqs: [
      { question: 'Can I consolidate merchant cash advances?', answer: 'Sometimes, but it depends on balances, payment history, cash flow, liens, and whether the new structure truly improves repayment capacity.' },
      { question: 'Will refinancing business debt hurt my chances with lenders?', answer: 'Not necessarily. A clear refinance that improves payment pressure can be positive. A pattern of repeated stacking without a fix can be a concern.' },
    ],
  },
  {
    slug: 'business-expansion-new-location',
    title: 'Business Expansion and New Location Loan Guide',
    shortTitle: 'Expansion / New Location',
    purpose: 'Open a new location, add capacity, hire staff, build out space, increase marketing, or support growth costs.',
    metaTitle: 'Business Expansion Loan Guide: New Location Process, Documents, and Tips',
    metaDescription:
      'Learn how expansion and new location financing works, what lenders review, required documents, common problems, and preparation tips.',
    keywords: ['business expansion loan', 'new location financing', 'business growth loan', 'expansion loan requirements'],
    heroSummary:
      'Expansion financing must prove that growth is realistic, not just exciting. Lenders want to see the current business is stable enough to support the expansion before the new location or added capacity fully pays off.',
    bestFor: [
      'Businesses with proven demand and stable current operations',
      'Owners opening a new location with a realistic budget',
      'Companies adding capacity tied to contracts, waitlists, or growth evidence',
      'Borrowers with a detailed expansion plan and contingency cushion',
    ],
    notIdealFor: [
      'Businesses expanding to escape problems at the current location',
      'Growth plans based only on optimistic projections',
      'Requests missing a budget, timeline, or ramp-up plan',
    ],
    typicalUses: ['Buildout', 'Deposits', 'Equipment', 'Hiring', 'Marketing', 'Opening inventory', 'Working capital cushion'],
    lenderFocus: [
      'Current business profitability and DSCR',
      'Expansion budget and timeline',
      'Ramp-up assumptions and break-even point',
      'Owner experience managing growth',
      'Lease terms, contracts, or demand evidence',
    ],
    process: [
      { title: 'Document the growth reason', description: 'Explain what demand, capacity issue, contract, or strategic reason is driving the expansion.' },
      { title: 'Build a detailed project budget', description: 'Break out buildout, equipment, inventory, staffing, marketing, deposits, and working capital.' },
      { title: 'Test repayment during ramp-up', description: 'The lender checks whether current cash flow can carry the payment before the expansion fully matures.' },
      { title: 'Review lease, permits, and timeline', description: 'New locations may involve landlord, construction, licensing, and opening-date risks.' },
      { title: 'Package the plan', description: 'A strong expansion request ties the numbers, project plan, documents, and repayment strategy together.' },
    ],
    requiredDocuments: [
      { title: 'Expansion budget', description: 'Shows all project costs and avoids underestimating the request.' },
      { title: 'Financial statements and tax returns', description: 'Shows current business strength before expansion.' },
      { title: 'Lease or location information', description: 'Important for new locations or buildout plans.' },
      { title: 'Contractor quotes or equipment invoices', description: 'Supports major project cost assumptions.' },
      { title: 'Projection or ramp-up plan', description: 'Shows how the expansion is expected to reach break-even and repay debt.' },
    ],
    declineReasons: [
      'Current business is not stable enough to support expansion',
      'Budget misses major costs or working capital needs',
      'Projections are too aggressive',
      'No evidence of demand or operational capacity',
      'Expansion timeline is uncertain or dependent on unresolved approvals',
    ],
    preparationTips: [
      'Include a working capital cushion in the request.',
      'Show current location performance before projecting the new location.',
      'Use conservative ramp-up assumptions.',
      'Prepare documents that prove costs, not just estimates in your head.',
    ],
    repaymentNotes:
      'Expansion loans are risky when repayment depends entirely on future growth. A stronger request shows that existing operations can handle some or all of the payment while the expansion ramps up.',
    serviceUpsell: {
      dscr: 'Use the free check to see whether current cash flow can support the expansion payment before relying on future projections.',
      packaging: 'Loan Packaging helps organize the expansion budget, use-of-funds, financials, and growth story for lender review.',
      brokering: 'Loan Brokering can help position the expansion with lenders that understand growth projects, new locations, and ramp-up risk.',
    },
    faqs: [
      { question: 'Do lenders accept projections for expansion loans?', answer: 'They may review projections, but verified current performance usually carries more weight than optimistic growth assumptions.' },
      { question: 'Should I borrow extra working capital for a new location?', answer: 'Often yes. Many expansion plans fail because they finance buildout and equipment but forget payroll, rent, inventory, marketing, and ramp-up cash needs.' },
    ],
  },
  {
    slug: 'franchise-financing',
    title: 'Franchise Financing Guide',
    shortTitle: 'Franchise Purchase',
    purpose: 'Finance franchise fees, buildout, equipment, opening inventory, training, and startup working capital.',
    metaTitle: 'Franchise Financing Guide: SBA Process, Documents, Requirements, and Tips',
    metaDescription:
      'Learn how franchise financing works, what lenders review, required documents, common decline reasons, and how to prepare a franchise loan package.',
    keywords: ['franchise financing', 'franchise loan', 'SBA franchise loan', 'franchise funding requirements'],
    heroSummary:
      'Franchise financing is part startup loan, part brand review, and part owner evaluation. Lenders look at the franchise system, project budget, borrower liquidity, location plan, and whether early cash flow can survive the ramp-up period.',
    bestFor: [
      'Approved franchisees with a defined concept and territory',
      'Borrowers with sufficient liquidity and a complete startup budget',
      'Franchise systems with clear operating history and lender familiarity',
      'Owners who understand startup ramp-up and working capital needs',
    ],
    notIdealFor: [
      'Borrowers with little liquidity after down payment',
      'Concepts with weak unit economics or limited operating history',
      'Projects missing location, buildout, or opening-cost clarity',
    ],
    typicalUses: ['Franchise fee', 'Buildout', 'Equipment', 'Opening inventory', 'Training', 'Startup working capital'],
    lenderFocus: [
      'Franchise brand performance and SBA eligibility where relevant',
      'Borrower credit, liquidity, and management background',
      'Total project cost and equity injection',
      'Site selection, lease, and buildout plan',
      'Projected break-even and working capital cushion',
    ],
    process: [
      { title: 'Confirm franchise approval and concept fit', description: 'Lenders need to know the borrower is approved and the brand is financeable.' },
      { title: 'Build the full project budget', description: 'Include franchise fee, construction, equipment, inventory, deposits, professional fees, and working capital.' },
      { title: 'Review borrower liquidity and equity injection', description: 'Franchise loans often fail when the borrower has no cushion after the down payment.' },
      { title: 'Underwrite location and ramp-up', description: 'The lender checks lease terms, opening timeline, break-even assumptions, and early operating needs.' },
      { title: 'Close with franchise and lender conditions', description: 'Funding may require franchise documents, lease approvals, insurance, entity documents, and SBA conditions.' },
    ],
    requiredDocuments: [
      { title: 'Franchise agreement or approval letter', description: 'Shows relationship with the franchisor and project status.' },
      { title: 'Franchise Disclosure Document information', description: 'Helps lenders understand costs, brand requirements, and unit economics.' },
      { title: 'Project budget and sources-and-uses', description: 'Shows full startup cost and borrower contribution.' },
      { title: 'Personal financial statement', description: 'Shows liquidity, net worth, and guarantor strength.' },
      { title: 'Business plan and projections', description: 'Explains launch plan, ramp-up, staffing, and repayment assumptions.' },
    ],
    declineReasons: [
      'Borrower does not have enough liquidity after closing',
      'Project budget is incomplete or underestimated',
      'Franchise brand or location risk is too high',
      'Projections are not supported by realistic unit economics',
      'Credit, collateral, or guarantor strength is weak',
    ],
    preparationTips: [
      'Do not understate working capital needs.',
      'Prepare a complete sources-and-uses table.',
      'Understand your franchisor fees and opening requirements.',
      'Keep enough liquidity after closing for delays and ramp-up.',
    ],
    repaymentNotes:
      'Franchise financing often relies on projections because the location may be new. Lenders therefore focus heavily on borrower liquidity, brand strength, project budget, and whether there is enough working capital to reach break-even.',
    serviceUpsell: {
      dscr: 'Use the free payment check for an early estimate, but franchise projects usually need deeper review because startup ramp-up matters.',
      packaging: 'Loan Packaging helps organize the franchise agreement, budget, projections, personal financial statement, and use-of-funds story.',
      brokering: 'Loan Brokering can help identify lenders familiar with franchise, SBA, and startup-style underwriting.',
    },
    faqs: [
      { question: 'Can SBA loans be used for franchises?', answer: 'Often yes if the franchise and borrower meet program requirements, but eligibility and structure depend on the specific brand, agreement, and lender.' },
      { question: 'What is the biggest mistake in franchise financing?', answer: 'Underestimating total project cost and working capital. Opening a location is expensive, and delays can strain cash before revenue stabilizes.' },
    ],
  },
  {
    slug: 'vehicle-purchase',
    title: 'Business Vehicle Financing Guide',
    shortTitle: 'Vehicle Purchase',
    purpose: 'Buy company cars, vans, trucks, trailers, delivery vehicles, or work vehicles used in the business.',
    metaTitle: 'Business Vehicle Financing Guide: Process, Requirements, Documents, and Tips',
    metaDescription:
      'Learn how business vehicle financing works, what lenders review, required documents, common decline reasons, and how to prepare before applying.',
    keywords: ['business vehicle loan', 'commercial vehicle financing', 'company truck loan', 'business auto loan'],
    heroSummary:
      'Vehicle financing is usually more straightforward when the vehicle has a clear business use. Lenders review the borrower, vehicle value, down payment, business cash flow, and whether the vehicle supports operations or revenue.',
    bestFor: ['Businesses buying vehicles used directly in operations', 'Delivery, service, construction, logistics, or field-service companies', 'Owners replacing unreliable vehicles', 'Requests with vehicle details, dealer quote, and business-use explanation'],
    notIdealFor: ['Vehicles used mostly for personal purposes', 'Requests where the payment strains monthly cash flow', 'Older vehicles with weak collateral value', 'Businesses without proof the vehicle supports operations'],
    typicalUses: ['Work trucks', 'Delivery vans', 'Company vehicles', 'Trailers', 'Specialty business vehicles'],
    lenderFocus: ['Vehicle price, age, mileage, and collateral value', 'Business use and revenue connection', 'Down payment or trade-in equity', 'Credit profile and guarantor strength', 'Cash flow after the new payment'],
    process: [
      { title: 'Identify the vehicle', description: 'Get the year, make, model, mileage, VIN if available, dealer quote, and total cost.' },
      { title: 'Explain business use', description: 'Show how the vehicle supports sales, service delivery, operations, or capacity.' },
      { title: 'Review payment capacity', description: 'The lender checks whether the business can support the vehicle payment plus existing obligations.' },
      { title: 'Confirm collateral and insurance', description: 'Vehicle value, title, insurance, and lien requirements are part of closing.' },
      { title: 'Fund the purchase', description: 'Many lenders pay the dealer or seller directly once loan documents are signed.' },
    ],
    requiredDocuments: [
      { title: 'Vehicle quote or purchase order', description: 'Shows the exact vehicle, cost, taxes, fees, and seller information.' },
      { title: 'Business bank statements', description: 'Verifies current cash flow and liquidity.' },
      { title: 'Financial statements or tax returns', description: 'May be required for larger requests or stronger programs.' },
      { title: 'Debt schedule', description: 'Shows existing payments that compete with the vehicle payment.' },
      { title: 'Insurance and business-use details', description: 'Helps support closing and underwriting.' },
    ],
    declineReasons: ['Vehicle is overpriced relative to value', 'Payment is too high for cash flow', 'Business use is unclear', 'Credit or existing debt is too weak', 'Vehicle age, mileage, or title issues create collateral concerns'],
    preparationTips: ['Get the full out-the-door price before applying.', 'Know whether you can contribute a down payment or trade-in.', 'Explain how the vehicle helps the business make or protect revenue.', 'Check the monthly payment before committing to the purchase.'],
    repaymentNotes: 'Vehicle loans are usually amortized over a term tied to vehicle age and useful life. The lender wants the payment to fit cash flow and the vehicle to retain enough value to support the loan.',
    serviceUpsell: {
      dscr: 'Use the free payment check to estimate whether the vehicle payment fits before you move forward with the dealer or lender.',
      packaging: 'Loan Packaging helps organize the vehicle quote, business-use explanation, financials, and debt schedule.',
      brokering: 'Loan Brokering can help if you need lenders that understand commercial vehicles, titled collateral, or industry-specific use cases.',
    },
    faqs: [
      { question: 'Can I finance a vehicle in the business name?', answer: 'Often yes, but lenders may still require a personal guaranty and will review business strength, credit, collateral, and use of the vehicle.' },
      { question: 'Is a down payment required?', answer: 'It depends on vehicle type, borrower strength, loan-to-value, and lender rules. Used or specialty vehicles may require more equity.' },
    ],
  },
  {
    slug: 'commercial-real-estate-refinance',
    title: 'Commercial Real Estate Refinance Guide',
    shortTitle: 'Commercial Real Estate Refinance',
    purpose: 'Refinance business property debt, address maturity, improve terms, lower payments, or access equity for a defined business use.',
    metaTitle: 'Commercial Real Estate Refinance Guide: Process, Requirements, Documents, and Tips',
    metaDescription:
      'Learn how commercial real estate refinance loans work, what lenders review, required documents, common decline reasons, and preparation tips.',
    keywords: ['commercial real estate refinance', 'commercial mortgage refinance', 'business property refinance', 'SBA refinance'],
    heroSummary:
      'Commercial real estate refinance is strongest when the new loan solves a clear problem: maturity, payment pressure, rate risk, property improvements, or a defined cash-out need that supports the business.',
    bestFor: ['Businesses with property debt nearing maturity', 'Owners seeking better payment structure', 'Borrowers with stable property value and business cash flow', 'Cash-out requests with a clear business purpose'],
    notIdealFor: ['Properties with weak collateral value', 'Businesses with declining cash flow and no explanation', 'Cash-out requests with vague use of funds', 'Loans with unresolved liens, taxes, or title problems'],
    typicalUses: ['Mortgage payoff', 'Maturity refinance', 'Payment reduction', 'Property improvements', 'Defined business cash-out'],
    lenderFocus: ['Property value and loan-to-value', 'Business or property DSCR', 'Current loan payoff and payment history', 'Use of any cash-out proceeds', 'Title, insurance, environmental, and tax status'],
    process: [
      { title: 'Document the current loan', description: 'Gather statements, payoff information, maturity date, rate, payment, and lien details.' },
      { title: 'Clarify the refinance goal', description: 'Explain whether the goal is maturity, payment relief, better terms, improvements, or defined cash-out.' },
      { title: 'Review property and business cash flow', description: 'The lender tests repayment and collateral value under the new structure.' },
      { title: 'Order property due diligence', description: 'Appraisal, title, insurance, and environmental review may be required.' },
      { title: 'Close and pay off existing debt', description: 'Refinance proceeds usually pay the existing lender directly.' },
    ],
    requiredDocuments: [
      { title: 'Current mortgage statement or payoff', description: 'Shows balance, payment, maturity, and lender information.' },
      { title: 'Business tax returns and financials', description: 'Verifies repayment capacity.' },
      { title: 'Property information', description: 'Address, use, occupancy, insurance, and property details.' },
      { title: 'Rent roll or lease documents', description: 'Needed when tenants help support repayment.' },
      { title: 'Use-of-funds summary', description: 'Important for cash-out or improvement requests.' },
    ],
    declineReasons: ['Appraised value is too low', 'Cash flow does not support the new loan', 'Cash-out purpose is weak', 'Title, tax, environmental, or property issues appear', 'Existing debt history shows serious payment problems'],
    preparationTips: ['Know your current payoff and maturity date.', 'Explain exactly what improves after refinance.', 'Prepare property documents early.', 'Do not assume cash-out is available without value and cash-flow support.'],
    repaymentNotes: 'A refinance should usually improve structure or solve a maturity problem. Lenders will test whether the new payment fits after property expenses, business debt, taxes, insurance, and required cushion.',
    serviceUpsell: {
      dscr: 'Use the free payment check to compare the refinance payment against available cash flow.',
      packaging: 'Loan Packaging helps organize payoff details, property documents, financials, and the refinance explanation.',
      brokering: 'Loan Brokering can help match the request with lenders comfortable with commercial property, SBA refinance, or cash-out restrictions.',
    },
    faqs: [
      { question: 'Can I take cash out when refinancing commercial property?', answer: 'Sometimes, but lenders review property value, loan-to-value, cash flow, and whether the cash-out use is acceptable.' },
      { question: 'When should I start a commercial refinance?', answer: 'Start well before maturity when possible because appraisal, title, environmental review, and underwriting can take time.' },
    ],
  },
  {
    slug: 'tenant-improvements-renovation',
    title: 'Tenant Improvement and Renovation Financing Guide',
    shortTitle: 'Tenant Improvements / Renovation',
    purpose: 'Finance buildout, renovations, fixtures, contractor costs, permits, leasehold improvements, or facility upgrades.',
    metaTitle: 'Tenant Improvement Financing Guide: Renovation Process, Documents, and Tips',
    metaDescription:
      'Learn tenant improvement and renovation financing requirements, lender process, documents needed, common approval issues, and preparation tips.',
    keywords: ['tenant improvement financing', 'renovation business loan', 'leasehold improvement loan', 'business buildout financing'],
    heroSummary: 'Renovation and tenant improvement financing is project-based. Lenders need to understand the budget, timeline, contractor plan, lease or property control, and how the improved space supports repayment.',
    bestFor: ['Businesses building out a leased space', 'Owners renovating facilities to increase capacity', 'Projects with contractor estimates and a realistic timeline', 'Borrowers with enough cushion for delays and overruns'],
    notIdealFor: ['Projects with vague budgets', 'Leases that do not support the improvement timeline', 'Businesses relying on unrealistic post-renovation growth', 'Borrowers with no contingency for overruns'],
    typicalUses: ['Buildout', 'Fixtures', 'Contractor payments', 'Permits', 'Furniture and equipment', 'Facility upgrades'],
    lenderFocus: ['Project budget and contractor quotes', 'Lease terms or property ownership', 'Timeline, permits, and completion risk', 'Business cash flow during construction', 'Post-project benefit and repayment plan'],
    process: [
      { title: 'Define the scope', description: 'List exactly what work is being completed and why the project matters.' },
      { title: 'Build the project budget', description: 'Break out labor, materials, permits, fixtures, equipment, deposits, and contingency.' },
      { title: 'Review lease or property control', description: 'Lenders want to know the business can use the improved space long enough to justify the debt.' },
      { title: 'Underwrite cash flow and project risk', description: 'The lender checks whether the business can handle payment during and after the project.' },
      { title: 'Fund around milestones or closing conditions', description: 'Some lenders disburse at closing, while others use invoices or progress draws.' },
    ],
    requiredDocuments: [
      { title: 'Contractor quotes or project budget', description: 'Supports the requested amount.' },
      { title: 'Lease or property documents', description: 'Shows control of the space and relevant terms.' },
      { title: 'Business financial statements', description: 'Verifies ability to repay.' },
      { title: 'Permits or plans if available', description: 'Helps prove the project is real and ready.' },
      { title: 'Use-of-funds summary', description: 'Connects the requested funds to specific improvements.' },
    ],
    declineReasons: ['Budget is incomplete', 'Lease term is too short', 'No reliable contractor or timeline', 'Cash flow cannot handle delays', 'Project benefit is unclear'],
    preparationTips: ['Add a contingency line to the budget.', 'Confirm landlord approvals before applying.', 'Get written quotes instead of rough guesses.', 'Explain how the project improves operations or revenue.'],
    repaymentNotes: 'Renovation debt can become stressful if payments start before the project produces benefit. Lenders may look closely at current cash flow and whether the business has enough cushion during construction or ramp-up.',
    serviceUpsell: {
      dscr: 'Use the free payment check to test whether the renovation payment works before assuming the project will pay for itself.',
      packaging: 'Loan Packaging helps organize quotes, lease details, project scope, financials, and the timing explanation.',
      brokering: 'Loan Brokering can help find lenders comfortable with buildout, renovation, or project-based funding.',
    },
    faqs: [
      { question: 'Can I finance leasehold improvements?', answer: 'Often yes, but lenders will review the lease, improvement value, project budget, and business cash flow.' },
      { question: 'Do I need contractor quotes?', answer: 'Usually yes. Written quotes make the request more credible and help justify the loan amount.' },
    ],
  },
  {
    slug: 'partner-buyout',
    title: 'Partner Buyout Financing Guide',
    shortTitle: 'Partner Buyout',
    purpose: 'Finance the buyout of an exiting partner, ownership restructuring, legal costs, closing costs, or transition needs.',
    metaTitle: 'Partner Buyout Financing Guide: Process, Requirements, Documents, and Tips',
    metaDescription:
      'Learn how partner buyout loans work, what lenders review, required documents, common decline reasons, and how to prepare a buyout request.',
    keywords: ['partner buyout loan', 'business partner buyout financing', 'ownership buyout loan', 'partner exit financing'],
    heroSummary: 'Partner buyout financing is about ownership transition and repayment. Lenders want to understand valuation, control after closing, business continuity, and whether cash flow supports the buyout debt.',
    bestFor: ['Businesses with a defined partner exit agreement', 'Companies with stable cash flow after ownership transition', 'Buyouts supported by valuation or agreed terms', 'Owners who can explain management continuity'],
    notIdealFor: ['Disputed buyouts with unresolved legal issues', 'Prices not supported by cash flow', 'Businesses dependent on the exiting partner without a transition plan', 'Requests with unclear ownership documents'],
    typicalUses: ['Partner payout', 'Legal costs', 'Closing costs', 'Ownership restructuring', 'Transition working capital'],
    lenderFocus: ['Buyout price and valuation support', 'Operating agreement and ownership documents', 'Cash flow after buyout debt', 'Role of exiting partner', 'Management and customer continuity'],
    process: [
      { title: 'Define the transaction', description: 'Clarify who is being bought out, the price, timing, and resulting ownership.' },
      { title: 'Support the valuation', description: 'The lender needs to understand why the buyout amount is reasonable.' },
      { title: 'Review continuity risk', description: 'If the exiting partner is important to operations or sales, the transition plan matters.' },
      { title: 'Underwrite repayment', description: 'The lender tests whether business cash flow can support the new debt.' },
      { title: 'Close with legal documentation', description: 'Buyouts usually require executed agreements, entity documents, releases, and updated ownership records.' },
    ],
    requiredDocuments: [
      { title: 'Buyout agreement or term sheet', description: 'Shows transaction amount, parties, and terms.' },
      { title: 'Operating agreement and ownership records', description: 'Verifies current and future ownership.' },
      { title: 'Business financial statements', description: 'Supports repayment and valuation.' },
      { title: 'Valuation or price support', description: 'Explains how the buyout amount was determined.' },
      { title: 'Transition plan', description: 'Shows how the business continues after the partner exits.' },
    ],
    declineReasons: ['Buyout price is too high for cash flow', 'Ownership dispute is unresolved', 'Exiting partner is critical with no replacement plan', 'Legal documents are incomplete', 'New debt weakens DSCR too much'],
    preparationTips: ['Resolve legal and ownership terms before applying.', 'Prepare a clear before-and-after ownership summary.', 'Explain why the business remains stable after the buyout.', 'Know the payment impact before finalizing price.'],
    repaymentNotes: 'The buyout does not directly buy new equipment or inventory, so lenders focus on whether existing business cash flow can support the new debt while maintaining operations after the ownership change.',
    serviceUpsell: {
      dscr: 'Use the free check to estimate whether the buyout payment fits the company cash flow.',
      packaging: 'Loan Packaging helps organize buyout terms, ownership records, financials, valuation support, and the transition story.',
      brokering: 'Loan Brokering can help position the request with lenders that understand ownership transitions and cash-flow-based buyouts.',
    },
    faqs: [
      { question: 'Can a business borrow to buy out a partner?', answer: 'Sometimes, if the price is supportable, documents are clean, and cash flow can handle the new debt.' },
      { question: 'Do lenders require a valuation?', answer: 'Not always, but some form of price support is helpful because lenders need to know the transaction is reasonable.' },
    ],
  },
  {
    slug: 'unexpected-expenses',
    title: 'Unexpected Business Expense Financing Guide',
    shortTitle: 'Unexpected Expenses',
    purpose: 'Cover emergency repairs, surprise bills, urgent replacement costs, temporary disruption, or unplanned operating expenses.',
    metaTitle: 'Unexpected Business Expense Financing Guide: Emergency Loan Process and Tips',
    metaDescription:
      'Learn how financing for unexpected business expenses works, what lenders review, required documents, common decline reasons, and preparation tips.',
    keywords: ['emergency business loan', 'unexpected business expenses', 'business repair financing', 'urgent business funding'],
    heroSummary: 'Unexpected expense financing is urgent, but lenders still need a clear story. The strongest requests explain what happened, why it is temporary, what the funds fix, and how the business repays after the disruption.',
    bestFor: ['Businesses facing a defined one-time cost', 'Owners replacing or repairing something essential', 'Companies with stable operations before the event', 'Requests with invoices, estimates, or proof of the expense'],
    notIdealFor: ['Ongoing losses with no turnaround plan', 'Vague emergency requests without documentation', 'Borrowers already overwhelmed by short-term debt', 'Costs that do not restore or protect operations'],
    typicalUses: ['Emergency repairs', 'Equipment replacement', 'Unexpected bills', 'Temporary disruption', 'Insurance deductible or timing gap'],
    lenderFocus: ['Proof of the expense', 'Whether the issue is one-time or ongoing', 'Cash flow before and after the event', 'Existing debt burden', 'Speed needed versus risk level'],
    process: [
      { title: 'Document what happened', description: 'Gather invoices, estimates, photos, notices, or other proof of the unexpected cost.' },
      { title: 'Explain business impact', description: 'Show what happens if the expense is not handled and how funding restores operations.' },
      { title: 'Review repayment capacity', description: 'The lender checks whether the business can repay once the issue is resolved.' },
      { title: 'Choose speed versus structure', description: 'Fast money may cost more, while better structures may require more documentation.' },
      { title: 'Use funds for the defined fix', description: 'A focused use of funds is easier to support than a vague emergency cushion.' },
    ],
    requiredDocuments: [
      { title: 'Invoice or repair estimate', description: 'Shows the cost and supports the requested amount.' },
      { title: 'Bank statements', description: 'Verifies current activity and cash position.' },
      { title: 'Financial statements', description: 'Shows business strength before the unexpected issue.' },
      { title: 'Debt schedule', description: 'Shows existing payment pressure.' },
      { title: 'Short explanation of the event', description: 'Connects the expense to business continuity and repayment.' },
    ],
    declineReasons: ['The expense is not documented', 'The business was already unstable before the event', 'Existing debt leaves no room for repayment', 'The request is too vague', 'The event points to a larger unresolved operating problem'],
    preparationTips: ['Gather proof before applying.', 'Be honest about what happened and what the funds fix.', 'Avoid taking the fastest offer without checking payment impact.', 'Separate true emergency costs from general working capital needs.'],
    repaymentNotes: 'Emergency loans can be expensive if speed is the only priority. The payment needs to fit after the issue is fixed, or the emergency loan can create a second cash-flow problem.',
    serviceUpsell: {
      dscr: 'Use the free payment check to avoid accepting an urgent payment that creates more pressure later.',
      packaging: 'Loan Packaging helps organize proof of the expense, financials, debt schedule, and the explanation lenders need quickly.',
      brokering: 'Loan Brokering can help if you need a lender fit quickly but still want to avoid random applications.',
    },
    faqs: [
      { question: 'Can I get funding quickly for an emergency expense?', answer: 'Possibly, but speed usually depends on documentation, credit, deposits, existing debt, and how clearly the expense is explained.' },
      { question: 'Should I use a short-term loan for an emergency?', answer: 'Only if the payment and cost make sense. Fast funding can help, but expensive debt can create new cash-flow stress.' },
    ],
  },
  {
    slug: 'bridge-financing',
    title: 'Bridge Financing Guide',
    shortTitle: 'Bridge Financing',
    purpose: 'Cover a short-term timing gap before a sale, refinance, closing, receivable, or longer-term funding event.',
    metaTitle: 'Bridge Financing Guide: Process, Requirements, Documents, and Risks',
    metaDescription:
      'Learn how bridge financing works, what lenders review, required documents, common decline reasons, repayment risks, and preparation tips.',
    keywords: ['bridge financing', 'business bridge loan', 'short term business loan', 'bridge loan requirements'],
    heroSummary:
      'Bridge financing is about timing and exit strategy. Lenders want to know exactly what temporary gap is being covered and what realistic event will repay or refinance the bridge.',
    bestFor: [
      'Borrowers with a defined short-term funding gap',
      'Deals waiting on a sale, refinance, closing, or receivable',
      'Businesses with a credible exit source',
      'Situations where speed matters but the repayment path is clear',
    ],
    notIdealFor: [
      'Businesses with no defined takeout or repayment event',
      'Long-term cash-flow problems disguised as short-term needs',
      'Borrowers who cannot handle higher cost or interest-only structure',
    ],
    typicalUses: ['Closing timing gaps', 'Short-term liquidity', 'Pending refinance bridge', 'Property or business transaction bridge', 'Receivable timing'],
    lenderFocus: [
      'Exit strategy and probability of repayment',
      'Collateral or transaction support',
      'Timeline and closing risk',
      'Borrower liquidity and fallback plan',
      'Cost tolerance and interest reserve if applicable',
    ],
    process: [
      { title: 'Define the exact bridge need', description: 'The request should explain what gap exists, how long it lasts, and why bridge money is needed now.' },
      { title: 'Document the exit', description: 'Lenders need evidence of the sale, refinance, receivable, or future funding source expected to repay the bridge.' },
      { title: 'Review collateral and fallback', description: 'Because bridge loans are short-term, lenders want protection if the expected exit is delayed.' },
      { title: 'Structure cost and term', description: 'Bridge financing may be interest-only, higher cost, and shorter duration than standard term loans.' },
      { title: 'Close quickly with tight conditions', description: 'Speed is common, but lenders still need documents proving the story and repayment path.' },
    ],
    requiredDocuments: [
      { title: 'Exit documentation', description: 'Purchase agreement, refinance term sheet, receivable support, or other evidence of repayment source.' },
      { title: 'Use-of-funds explanation', description: 'Shows what the bridge covers and why timing matters.' },
      { title: 'Financial statements and bank statements', description: 'Verifies current business condition and liquidity.' },
      { title: 'Collateral documents', description: 'May include property, receivable, equipment, or transaction documents.' },
      { title: 'Debt schedule', description: 'Shows obligations that affect bridge repayment risk.' },
    ],
    declineReasons: [
      'Exit strategy is weak or speculative',
      'Timeline is unrealistic',
      'Collateral does not support the risk',
      'Borrower has no fallback if the exit is delayed',
      'The request is really a long-term cash-flow problem',
    ],
    preparationTips: [
      'Lead with the exit strategy, not just the urgent need.',
      'Prepare proof that the repayment event is real.',
      'Understand the cost before accepting speed.',
      'Have a fallback plan if the sale, refinance, or receivable is delayed.',
    ],
    repaymentNotes:
      'Bridge loans are often interest-only and short term. The monthly payment may look manageable, but the real risk is maturity. If the takeout event does not happen, the borrower may face refinance pressure or default risk.',
    serviceUpsell: {
      dscr: 'Use the payment check to understand carrying cost, but bridge financing also requires a strong exit strategy beyond monthly affordability.',
      packaging: 'Loan Packaging helps organize the timing story, exit evidence, financials, collateral details, and payoff plan.',
      brokering: 'Loan Brokering can be useful when the request is time-sensitive and needs lenders comfortable with bridge structures.',
    },
    faqs: [
      { question: 'Are bridge loans expensive?', answer: 'They can be. Borrowers often pay for speed, flexibility, and short-term risk. The key is whether the cost is justified by a credible exit.' },
      { question: 'What is the most important part of a bridge loan request?', answer: 'The exit strategy. Lenders want a believable source of repayment, not just urgency.' },
    ],
  },
];

export function getLoanGuideBySlug(slug: string) {
  return loanGuides.find((guide) => guide.slug === slug);
}
