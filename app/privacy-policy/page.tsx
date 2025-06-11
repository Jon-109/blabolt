import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Business Lending Advocate",
  description: "Read our privacy policy to understand how we handle user data and privacy at Business Lending Advocate.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-2 sm:px-4 py-12 bg-white dark:bg-gray-900">
      <section className="w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-center text-lg text-gray-600 dark:text-gray-300 font-medium">Business Lending Advocate</p>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1">Last updated June 11, 2025</p>
        </header>
        <section className="space-y-24">
          <article className="prose dark:prose-invert max-w-none mx-auto prose-h2:mt-16 prose-h2:mb-8 prose-h3:mt-10 prose-h3:mb-4 prose-table:my-8 prose-p:my-6 prose-ul:my-6 prose-li:my-2 prose-h2:scroll-mt-24">
            <h2 className="text-2xl font-bold mt-0">1. Who We Are</h2>
            <p>Business Lending Advocate (“BLA,” “we,” “our,” or “us”) helps small-business owners analyze cash flow, prepare lender-ready documents, and navigate the loan-application process. This policy explains how we collect, use, and protect personal information when you visit <span className="break-all">businesslendingadvocate.com</span> or use any BLA service (the “Services”).</p>
            <h2 className="text-2xl font-bold mt-16">2. Information We Collect</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-2 font-semibold text-left border-b border-gray-200 dark:border-gray-700">Category</th>
                    <th className="p-2 font-semibold text-left border-b border-gray-200 dark:border-gray-700">What We Collect</th>
                    <th className="p-2 font-semibold text-left border-b border-gray-200 dark:border-gray-700">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="even:bg-gray-50 dark:even:bg-gray-900">
                    <td className="p-2 align-top">Account Data</td>
                    <td className="p-2 align-top">• Name<br/>• Email address (via Supabase Auth or Google Sign-In)</td>
                    <td className="p-2 align-top">• Create and manage your BLA account<br/>• Authenticate log-ins</td>
                  </tr>
                  <tr className="even:bg-gray-50 dark:even:bg-gray-900">
                    <td className="p-2 align-top">Financial Inputs (User-Provided)</td>
                    <td className="p-2 align-top">• Revenue, expenses, outstanding debt, and other figures you enter while using our cash-flow and DSCR tools</td>
                    <td className="p-2 align-top">• Generate interactive analyses and lender-style PDF reports you request</td>
                  </tr>
                  <tr className="even:bg-gray-50 dark:even:bg-gray-900">
                    <td className="p-2 align-top">Payment Data</td>
                    <td className="p-2 align-top">• Card details & billing ZIP (processed by Stripe)</td>
                    <td className="p-2 align-top">• Process payments for premium services</td>
                  </tr>
                  <tr className="even:bg-gray-50 dark:even:bg-gray-900">
                    <td className="p-2 align-top">Usage & Analytics</td>
                    <td className="p-2 align-top">• IP address, device/browser type, pages viewed, clicks (via Google Analytics cookies)</td>
                    <td className="p-2 align-top">• Improve site performance and understand user engagement</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">We do not collect Social Security numbers, phone numbers, or tax IDs.</p>
            <h2 className="text-2xl font-bold mt-16">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6">
              <li><b>Service Delivery</b> — create your account, authenticate, generate reports, and email PDFs you request.</li>
              <li><b>Transactional Communications</b> — send receipts, account alerts, or service-related updates.</li>
              <li><b>Marketing (Opt-In Only)</b> — if you subscribe to our newsletter, email product updates or educational content. Unsubscribe any time.</li>
              <li><b>Analytics & Improvements</b> — analyze aggregated, de-identified usage data to enhance the Services.</li>
            </ul>
            <h2 className="text-2xl font-bold mt-16">4. Legal Basis & Geographic Scope</h2>
            <p>BLA serves businesses located in the United States only. We process data with your consent and to fulfill our contract—providing the Services you request.</p>
            <h2 className="text-2xl font-bold mt-16">5. Cookies & Tracking</h2>
            <p>We use first-party cookies for session management and Google Analytics cookies for usage statistics. Analytics cookies do not reveal personal identities. You can disable cookies in your browser, but parts of the site may not function.</p>
            <h2 className="text-2xl font-bold mt-16">6. Payment Processing</h2>
            <p>Payments are handled by Stripe, Inc. Stripe stores your card information on its PCI-DSS-compliant servers. BLA never sees or stores full card numbers, CVV codes, or Social Security numbers.</p>
            <h2 className="text-2xl font-bold mt-16">7. Data Storage & Security</h2>
            <ul className="list-disc pl-6">
              <li>All user data—account, financial inputs, and generated reports—is stored in Supabase (hosted on AWS).</li>
              <li>Data is encrypted in transit (HTTPS/TLS) and at rest.</li>
              <li>Access is restricted to you and authorized BLA administrators who need it to provide support.</li>
              <li>We retain data indefinitely so you can revisit or update prior analyses. If you request deletion (see Section 9), we will remove your account and associated data within 30 days unless retention is required for legal or accounting reasons.</li>
            </ul>
            <h2 className="text-2xl font-bold mt-16">8. Third-Party Disclosure</h2>
            <p>We do not sell or share personal information with third-party advertisers. We disclose data only to:</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-2 font-semibold text-left border-b border-gray-200 dark:border-gray-700">Service</th>
                    <th className="p-2 font-semibold text-left border-b border-gray-200 dark:border-gray-700">Purpose</th>
                    <th className="p-2 font-semibold text-left border-b border-gray-200 dark:border-gray-700">Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="even:bg-gray-50 dark:even:bg-gray-900">
                    <td className="p-2 align-top">Supabase</td>
                    <td className="p-2 align-top">Authentication, database, file storage</td>
                    <td className="p-2 align-top">Account data, finance inputs</td>
                  </tr>
                  <tr className="even:bg-gray-50 dark:even:bg-gray-900">
                    <td className="p-2 align-top">Google OAuth</td>
                    <td className="p-2 align-top">Optional log-in method</td>
                    <td className="p-2 align-top">Name, email (for sign-in only)</td>
                  </tr>
                  <tr className="even:bg-gray-50 dark:even:bg-gray-900">
                    <td className="p-2 align-top">Stripe</td>
                    <td className="p-2 align-top">Payment processing</td>
                    <td className="p-2 align-top">Name, email, payment details</td>
                  </tr>
                  <tr className="even:bg-gray-50 dark:even:bg-gray-900">
                    <td className="p-2 align-top">Google Analytics</td>
                    <td className="p-2 align-top">Site analytics</td>
                    <td className="p-2 align-top">Pseudonymized usage data</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">We deploy via Universal (hosting provider). Universal may have incidental access to encrypted data but does not process personal information for its own purposes.</p>
            <h2 className="text-2xl font-bold mt-16">9. Your Rights</h2>
            <p>Because we serve U.S. customers only, you have the right to:</p>
            <ul className="list-disc pl-6">
              <li><b>Access</b> — request a copy of the personal data we hold.</li>
              <li><b>Correction</b> — edit your data anytime in your account dashboard.</li>
              <li><b>Deletion</b> — email us to delete your account and data.</li>
              <li><b>Portability</b> — request your data in a machine-readable format.</li>
            </ul>
            <p>How to exercise: email <a href="mailto:jonathan@businesslendingadvocate.com" className="text-blue-600 underline">jonathan@businesslendingadvocate.com</a> from the address on file. We may verify your identity before fulfilling a request.</p>
            <h2 className="text-2xl font-bold mt-16">10. Children’s Privacy</h2>
            <p>The Services are not directed to children under 13. We do not knowingly collect data from anyone under 13. If you believe a child has provided personal information, contact us and we will delete it.</p>
            <h2 className="text-2xl font-bold mt-16">11. Data Breach Procedures</h2>
            <p>If a breach affecting personal data occurs, we will notify affected users and relevant authorities within required legal timeframes, outlining what happened, data impacted, and remedial steps taken.</p>
            <h2 className="text-2xl font-bold mt-16">12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy occasionally. We’ll post the new version on this page and adjust the “Last updated” date. Significant changes will be emailed to account holders.</p>
            <h2 className="text-2xl font-bold mt-16">13. Contact Us</h2>
            <p className="mb-0">Questions or requests?</p>
            <p className="mb-0">Jonathan Aranda</p>
            <p>Email: <a href="mailto:jonathan@businesslendingadvocate.com" className="text-blue-600 underline">jonathan@businesslendingadvocate.com</a></p>
          </article>
        </section>
      </section>
    </main>
  );
}
