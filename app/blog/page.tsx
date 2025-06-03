import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SubscribeForm from './SubscribeForm';

export const metadata: Metadata = {
  title: 'Small Business Lending Blog | Business Lending Advocate',
  description:
    'Actionable tips and insights to help small businesses get funded. Learn about DSCR, cash flow, loan packaging, SBA loans, and more.',
  openGraph: {
    title: 'Small Business Lending Blog | Business Lending Advocate',
    description: 'Actionable tips and insights to help small businesses get funded. Learn about DSCR, cash flow, loan packaging, SBA loans, and more.',
    url: 'https://businesslendingadvocate.com/blog',
    images: [
      {
        url: '/images/Logo.png',
        width: 400,
        height: 400,
        alt: 'Business Lending Advocate Logo',
      },
    ],
    type: 'website',
  },
};

const blogs = [
  {
    slug: 'how-to-make-your-business-loan-ready-5-mistakes',
    title: 'How to Make Your Business Loan-Ready: 5 Mistakes That Get Applications Rejected',
    description: 'Avoid the hidden red flags that sink small-business loan requests—and learn the simple fixes that turn lenders into eager partners.',
    coverImage: '/images/business-loan-readiness-cover.png',
    tags: ['LoanReadiness', 'Mistakes', 'SmallBusiness'],
  },
  {
    slug: 'ultimate-loan-packaging',
    title: 'Coming Soon: The Ultimate Guide to Loan Packaging',
    description: 'We break down every document and step you need to impress lenders and secure funding.',
    coverImage: '/images/Logo.png',
    tags: ['LoanPackaging', 'SBA'],
  },
  {
    slug: 'cash-flow-analysis-demystified',
    title: 'Coming Soon: Cash Flow Analysis Demystified',
    description: 'Understand what lenders look for and how to present your business’s cash flow with confidence.',
    coverImage: '/images/Logo.png',
    tags: ['CashFlow', 'DSCR'],
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center pb-32 relative overflow-x-hidden">
      {/* Decorative background wave */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-64 pointer-events-none z-0">
        <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path fill="#e5e7eb" fillOpacity="0.5" d="M0,160L80,176C160,192,320,224,480,218.7C640,213,800,171,960,154.7C1120,139,1280,149,1360,154.7L1440,160L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"/>
        </svg>
      </div>
      {/* Hero Section */}
      <section className="w-full max-w-7xl flex flex-col items-center justify-center text-center mt-8 mb-6 px-4 z-10 relative mx-auto">
        {/* Icon */}
        <div className="mb-2">
          {/* Lightbulb SVG */}
          <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-400 w-14 h-14 mx-auto">
            <circle cx="27" cy="27" r="27" fill="#FEF3C7"/>
            <path d="M27 14a9 9 0 00-4 17.1V34a1 1 0 001 1h6a1 1 0 001-1v-2.9A9 9 0 0027 14z" stroke="#FBBF24" strokeWidth="2" fill="#FEF3C7"/>
            <rect x="23" y="34" width="8" height="4" rx="2" fill="#FBBF24"/>
            <rect x="25" y="38" width="4" height="2" rx="1" fill="#FBBF24"/>
          </svg>
        </div>
        <div className="w-full max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 w-full">Small Business Lending Blog</h1>
          <p className="text-lg md:text-xl text-gray-700 mb-1 w-full">
            Explore expert tips, tools, and real talk about getting your business funded. We break down DSCR, cash flow, loan packaging, and everything lenders care about.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="w-full max-w-6xl px-4 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, idx) => (
            <div
              key={blog.slug}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-stretch p-6 relative min-h-[340px]"
            >
              {idx === 0 ? (
                <Link href="/blog/how-to-make-your-business-loan-ready-5-mistakes" className="absolute inset-0 z-10" aria-label={blog.title} />
              ) : null}
              <div className="w-full h-40 bg-gray-100 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                <Image
                  src={blog.coverImage || '/images/Logo.png'}
                  alt={blog.title}
                  width={320}
                  height={160}
                  className="object-cover w-full h-full"
                />
              </div>
              {idx !== 0 && (
                <span className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm rounded-full flex items-center gap-1">
                  <span role="img" aria-label="clock">⏰</span> Coming Soon
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{blog.title}</h2>
              <div className="flex flex-wrap gap-2 mb-2">
                {blog.tags.map(tag => (
                  <span key={tag} className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">#{tag}</span>
                ))}
              </div>
              <p className="text-gray-600 text-base mb-2">{blog.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Buttons */}
      <section className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mt-8 px-4 items-center justify-center z-10">
        <Link href="/services" className="w-full md:w-auto transform transition hover:scale-105">
          <span className="block w-full text-center bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors">
            Our Services
          </span>
        </Link>
        <Link href="/cash-flow-analysis" className="w-full md:w-auto transform transition hover:scale-105">
          <span className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors">
            Cash Flow Analysis
          </span>
        </Link>
        <Link href="/loan-packaging" className="w-full md:w-auto transform transition hover:scale-105">
          <span className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors">
            Loan Packaging
          </span>
        </Link>
      </section>
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            url: 'https://businesslendingadvocate.com/blog',
            headline: 'Small Business Lending Blog',
            publisher: {
              '@type': 'Organization',
              name: 'Business Lending Advocate',
              logo: {
                '@type': 'ImageObject',
                url: 'https://businesslendingadvocate.com/images/Logo.png',
              },
            },
          }),
        }}
      />
    </main>
  );
}

