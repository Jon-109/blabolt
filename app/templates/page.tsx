import Link from 'next/link';

const templates = [
  { 
    slug: 'balance_sheet', 
    title: 'Balance Sheet', 
    desc: 'Show lenders exactly what your business owns and owes with a professional balance sheet that banks trust.',
    icon: '📊',
    difficulty: 'Beginner',
    time: '5-10 min',
    category: 'Financial Statements'
  },
  { 
    slug: 'income_statement', 
    title: 'Income Statement', 
    desc: 'Prove your business profitability with a clear profit & loss statement that highlights your revenue and expenses.',
    icon: '💰',
    difficulty: 'Beginner',
    time: '8-12 min',
    category: 'Financial Statements'
  },
  { 
    slug: 'personal_financial_statement', 
    title: 'Personal Financial Statement', 
    desc: 'Meet SBA requirements with a complete personal net worth statement that shows your financial strength.',
    icon: '👤',
    difficulty: 'Intermediate',
    time: '10-15 min',
    category: 'Personal Finance'
  },
  { 
    slug: 'personal_debt_summary', 
    title: 'Personal Debt Summary', 
    desc: 'Organize all your personal debts in one clear document that lenders can quickly review and understand.',
    icon: '📋',
    difficulty: 'Beginner',
    time: '5-8 min',
    category: 'Personal Finance'
  },
  { 
    slug: 'business_debt_summary', 
    title: 'Business Debt Summary', 
    desc: 'Present your business obligations professionally with detailed debt information that builds lender confidence.',
    icon: '🏢',
    difficulty: 'Beginner',
    time: '8-12 min',
    category: 'Business Finance'
  },
];

export default function TemplatesHub() {
  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <span className="mr-2">✨</span>
              Professional Financial Documents
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Lender-Ready</span> Financial Documents
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transform your financial data into professional documents that banks and lenders trust. 
              No accounting experience required – our guided forms make it simple.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Auto-saves progress
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Bank-approved formats
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Instant PDF generation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Nav */}
      <div className="max-w-7xl mx-auto px-6 pb-4">
        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-gradient-to-br from-slate-50/80 via-blue-50/80 to-indigo-50/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur rounded-b-xl border-b border-blue-100/30">
          <nav className="overflow-x-auto" aria-label="Template categories">
            <ul className="flex gap-2 md:gap-3">
              {categories.map((c) => {
                const id = c.toLowerCase().replace(/\s+/g, '-');
                return (
                  <li key={c}>
                    <a
                      href={`#${id}`}
                      className="inline-flex items-center rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-sm text-blue-700 hover:bg-white hover:border-blue-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {c}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {categories.map(category => {
          const categoryTemplates = templates.filter(t => t.category === category);
          const id = category.toLowerCase().replace(/\s+/g, '-');
          return (
            <section key={category} id={id} className="scroll-mt-20 mb-12" aria-labelledby={`${id}-heading`}>
              <h2 id={`${id}-heading`} className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full mr-4"></div>
                {category}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTemplates.map(template => (
                  <Link
                    key={template.slug}
                    href={`/templates/${template.slug}`}
                    aria-label={`Start ${template.title}`}
                    className="group relative h-full flex flex-col bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 motion-safe:hover:-translate-y-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {/* Template Icon */}
                    <div className="absolute -top-4 left-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                        {template.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mt-8 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                          {template.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              template.difficulty === 'Beginner'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {template.difficulty}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                        {template.desc}
                      </p>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {template.time}
                        </div>
                        <span className="inline-flex items-center text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 rounded-full shadow hover:from-blue-700 hover:to-indigo-700 group-focus:from-blue-700 group-focus:to-indigo-700">
                          Start Now
                          <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* How It Works Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple 3-Step Process</h2>
            <p className="text-lg text-gray-600">From data entry to professional PDF in minutes</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  1
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fill Simple Forms</h3>
              <p className="text-gray-600 leading-relaxed">
                Answer easy questions about your finances. Our forms use plain English and provide helpful tips along the way.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  2
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Auto-Save Progress</h3>
              <p className="text-gray-600 leading-relaxed">
                Never lose your work. Everything saves automatically as you type, so you can come back anytime to finish.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  3
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Download PDF</h3>
              <p className="text-gray-600 leading-relaxed">
                Get a professional, bank-ready PDF instantly. Perfect formatting that lenders expect and trust.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
