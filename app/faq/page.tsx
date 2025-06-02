"use client";

import React from 'react';
import { Plus, Minus, Search, MessageCircle, Mail, Phone } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const categories = [
    {
      name: "Loan Process",
      icon: "🔄",
      faqs: [
        {
          question: "How long does the loan application take?",
          answer: `• Conventional & equipment loans: typically 2–8 weeks from initial file to funding.
• SBA 7(a): usually 60–90 days due to extensive forms, disclosures, and documentation.

How Business Lending Advocate speeds this up:
• Our software guides you step-by-step through every required document and includes easy forms that produce lender-ready templates, so you’re never guessing what’s needed. It’s like having an expert at your side throughout the process.
• We eliminate most back-and-forth by ensuring your application is complete and tailored to each lender’s requirements from day one.
• This typically cuts 25–40% off the review time—meaning you get answers (and funding) much faster than the industry average.

We work for you, not the bank.`
        },
        {
          question: "Which documents will I need?",
          answer: `Requirements change with loan purpose, but most lenders ask for the last 2 years of business tax returns, last 2 years of personal returns for owners ⩾ 20 %, and year-to-date financials (P&L + balance sheet). 
          
          How Business Lending Advocate helps: Our Loan Packaging service walks you through every document required, and even supplies templates.`
        },
        {
          question: "Do I need a cover letter for the lender?",
          answer: `Yes—think of it as a one-page executive summary that lets an underwriter “get” your business before diving into spreadsheets. It explains your company’s story, the purpose of the loan, how the funds will be repaid (primary source), and what backstops repayment (secondary source such as personal guarantee or collateral).

          What Business Lending Advocate does: We draft and polish your cover letter so it’s geared to what lenders want to see—highlighting your management experience, industry trends, and risk mitigants—to present your business in the best possible light and set a professional tone for your entire loan package.`
        },
        {
          question: "What happens after I submit everything?",
          answer: `Underwriting review (3–5 business days) – lender verifies numbers, pulls credit, and runs ratio tests.

Follow-up questions (2–7 days) – called a “credit memo.” We answer most on your behalf the same day.

Conditional approval / term sheet (3–10 days) – spells out rate, term, fees, collateral, guarantees, and closing conditions.

Closing & funding (5–15 business days) – collect any final items (e.g., landlord waiver), sign docs, and receive wires—often within 24 hours of signing.`
        }
      ]
    },
    {
      name: "Financial Terms",
      icon: "💰",
      faqs: [
        {
          question: "What is DSCR and why is it important?",
          answer: (
            <>
              Debt Service Coverage Ratio (DSCR) measures how comfortably your business can pay its debts:
              <pre className="bg-gray-100 rounded px-3 py-2 font-mono text-sm overflow-x-auto mt-4 mb-2">Net Income ÷ (Annual Debt Service + Annualized Loan Payment)</pre>
              <ul className="list-disc pl-6 mb-2">
                <li>Annual Debt Service = principal + interest on all existing loans.</li>
                <li>Annualized Loan Payment = monthly payment on the new loan × 12.</li>
              </ul>
              <p className="mb-4">A DSCR ≥ 1.25 tells banks you generate $1.25 for every $1 of debt payments—a safe cushion.</p>
              <div className="flex flex-col gap-3 my-6">
                <a href="/cash-flow-analysis" className="bg-primary-blue text-white px-4 py-2 rounded font-semibold shadow hover:bg-primary-blue/90 text-center">Try the Free DSCR Calculator</a>
              </div>
              <p className="mt-2">For our comprehensive, bank-level analysis, we use Adjusted EBITDA as the numerator. Adjusted EBITDA adds back owner salary, one-time expenses, and non-cash charges—showing lenders your true cash flow and often improving your DSCR. This makes you look stronger in the eyes of the bank and can help you qualify for better terms.</p>
              <div className="flex flex-col gap-3 mt-3">
                <a href="/cash-flow-analysis" className="bg-gray-900 text-white px-4 py-2 rounded font-semibold shadow hover:bg-gray-800 text-center">See Comprehensive Analysis</a>
              </div>
            </>
          )
        },
        {
          question: "What affects my interest rate?",
          answer: `• Credit quality – both business and personal scores/history.
• Cash-flow strength – DSCR trend, profitability volatility.
• Collateral & guarantees – the more (and higher-quality) security you pledge, the lower the perceived risk.
• Loan purpose & term – equipment loans and real-estate mortgages usually price better than pure working-capital lines.
• Market benchmark – Prime or SOFR plus a risk spread. We shop multiple offers and negotiate the spread down whenever possible.`
        },
        {
          question: "Do I need collateral?",
          answer: `For most SBA 7(a) loans over $25k, lenders must take available collateral (business assets first, then personal real estate) if it exists—but the SBA will still guarantee the unsecured portion. Working-capital SBA loans may require only a UCC lien on business assets. Real-estate purchases, of course, are collateralized by the property itself. We outline collateral expectations during your readiness assessment so there are no surprises.`
        },
        {
          question: "What is a personal guarantee, and how can I protect myself?",
          answer: `A personal guarantee (PG) means you, the owner, promise to repay if the business defaults. Most small-business loans, especially SBA, require it. Business Lending Advocate helps you:
• Limit the PG to only the principal owners;
• Negotiate a burn-off clause (PG drops after DSCR stays above a target for 24 months);
• Structure life-insurance or key-person coverage so the debt doesn’t pass to your family.`
        }
      ]
    },
    {
      name: "Our Services",
      icon: "🤝",
      faqs: [
        {
          question: "How do you improve my approval odds?",
          answer: `• Data scrub: adjust EBITDA with owner add-backs and non-recurring items.
• Bank-ready cover letter & ratio sheet: paints the best picture and tackles lender objections up front.
• Targeted lender outreach: we know which lenders like your industry, deal size, and collateral mix.
• Personal-guarantee strategy: show lenders a solid secondary repayment source without over-committing you.
• Offer comparison: multiple term sheets give leverage to pick the best rate and structure.`
        },
        {
          question: "What do your services cost?",
          answer: `• DSCR Quick Calculator: FREE on our site.
• Comprehensive Cash-Flow Analysis: $99 flat.
• Loan Packaging: $499 (includes templates, cover-letter drafting, and full lender file).
• Loan Brokering: 1% of the funded amount, payable only at closing—no upfront broker fee.`
        },
        {
          question: "Do you guarantee I’ll get funded?",
          answer: `We can’t promise approval—no legitimate firm can. What we do guarantee is a bank-quality loan package and guidance that gives you the strongest possible chance under current credit standards.`
        }
      ]
    },
    {
      name: "Lender Relations",
      icon: "🏦",
      faqs: [
        {
          question: "What if my credit isn’t perfect?",
          answer: `Imperfect credit doesn’t stop financing. Because SBA 7(a) loans carry a federal guarantee covering up to 85% of the principal, many banks will overlook a score in the mid-600s if cash flow and collateral check out. Business Lending Advocate positions your recent cash-flow stability and DSCR improvements front-and-center to offset score issues.`
        },
        {
          question: "Can I keep banking with my current bank?",
          answer: `Yes. Receiving offers from multiple banks is smart because you can compare rates and covenants. If you ultimately prefer your existing bank, our $499 Loan Packaging service lets you hand them a complete, polished file—often winning you the same terms they reserve for their best customers.`
        }
      ]
    }
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => {
      // Always search question
      const questionMatch = faq.question.toLowerCase().includes(searchTerm.toLowerCase());
      // If answer is a string, search it; if JSX, use 'searchableText' if provided
      let answerMatch = false;
      if (typeof faq.answer === 'string') {
        answerMatch = faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
      } else if ('searchableText' in faq && typeof faq.searchableText === 'string') {
        answerMatch = faq.searchableText.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return questionMatch || answerMatch;
    })
  })).filter(category => category.faqs.length > 0);

  // Helper to render answer with rich formatting
  function renderAnswer(answer: string) {
    // Split into blocks by double line breaks for paragraphs/lists
    const blocks = answer.split(/\n\n+/);
    return (
      <div className="text-gray-600 leading-relaxed space-y-4">
        {blocks.map((block, i) => {
          // Render formula/code block
          if (/^\s*Adjusted EBITDA/.test(block) || block.includes('÷') || block.includes('=') && block.length < 80) {
            return <pre key={i} className="bg-gray-100 rounded px-3 py-2 font-mono text-sm overflow-x-auto">{block}</pre>;
          }
          // Render bullet lists
          if (/^\s*[•\-]/.test(block)) {
            const items = block.split(/\n/).filter(line => /^\s*[•\-]/.test(line));
            return (
              <ul className="list-disc pl-6 space-y-1" key={i}>
                {items.map((item, j) => <li key={j}>{item.replace(/^\s*[•\-]\s*/, '')}</li>)}
              </ul>
            );
          }
          // Render normal paragraphs (with line breaks inside)
          return <p key={i}>{block.split(/\n/).map((line, j) => <React.Fragment key={j}>{j > 0 && <br />}{line}</React.Fragment>)}</p>;
        })}
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-blue to-primary-blue/80 text-white py-6">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How Can We Help You?
            </h1>
            <p className="text-xl mb-8">
              Find answers to common questions about our services and the business
              lending process.
            </p>
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for answers..."
                className="w-full px-6 py-4 rounded-lg text-gray-900 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {filteredCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                </div>
                <div className="space-y-4">
                  {category.faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:border-primary-blue/80 transition-colors"
                    >
                      <button
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      >
                        <span className="text-lg font-semibold text-gray-900 pr-8">
                          {faq.question}
                        </span>
                        {openIndex === index ? (
                          <Minus className="w-5 h-5 text-primary-blue flex-shrink-0" />
                        ) : (
                          <Plus className="w-5 h-5 text-primary-blue flex-shrink-0" />
                        )}
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          openIndex === index ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
                        } overflow-hidden`}
                      >
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                          {typeof faq.answer === 'string' ? renderAnswer(faq.answer) : faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">
              Still Have Questions?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="w-12 h-12 bg-primary-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary-blue" />
                </div>
                <h3 className="font-semibold mb-2">Email Us</h3>
                <p className="text-gray-600 mb-4">Get a response within 24 hours</p>
                <a href="mailto:jonathan@businesslendingadvocate.com" className="text-primary-blue font-semibold hover:text-primary-blue/80">
                  jonathan@businesslendingadvocate.com
                </a>
              </div>
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="w-12 h-12 bg-primary-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-primary-blue" />
                </div>
                <h3 className="font-semibold mb-2">Call Us</h3>
                <p className="text-gray-600 mb-4">Mon-Fri from 9am to 5pm</p>
                <a href="tel:210-370-7402" className="text-primary-blue font-semibold hover:text-primary-blue/80">
                  210-370-7402
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}