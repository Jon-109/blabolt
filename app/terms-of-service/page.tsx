import Header from "../(components)/shared/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Blabolt",
  description: "Read the Terms of Service for Blabolt, including information on user data and privacy handling.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-start min-h-screen bg-white pt-6 px-4 md:px-0">
        <section className="w-full max-w-4xl mt-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-8 tracking-tight text-gray-900">Terms of Service</h1>
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 space-y-8 border border-gray-100">
            <div className="text-center">
              <p className="font-semibold text-lg text-gray-900">Business Lending Advocate</p>
              <p className="text-gray-700">Legal entity: Lending Advocate, LLC (“BLA,” “we,” “our,” “us”)</p>
              <p className="text-gray-500 text-sm mt-1">Last updated June 11, 2025</p>
            </div>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">1. Acceptance of These Terms</h2>
              <p className="text-gray-700">By accessing businesslendingadvocate.com or any related sub-domain (the “Site”) and using our software, dashboards, reports, or services (collectively, the “Services”), you (“you,” “your,” or the “User”) agree to be bound by these Terms of Service (“Terms”). If you do not agree, do not use the Services.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">2. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><span className="font-medium">U.S.-only.</span> The Services are offered solely to individuals and businesses located in the United States.</li>
                <li><span className="font-medium">Age.</span> You must have the legal capacity to enter a binding contract in your jurisdiction. The Services are not directed to children under 13.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">3. Services & Fees</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg text-left text-sm mb-4">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Offering</th>
                      <th className="py-2 px-3 font-semibold">One-Time Fee</th>
                      <th className="py-2 px-3 font-semibold">Billing Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="py-2 px-3">Comprehensive Cash-Flow Analysis</td>
                      <td className="py-2 px-3">$99</td>
                      <td className="py-2 px-3">Payable at checkout via Stripe. Generates a lender-style PDF report.</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3">Loan Packaging</td>
                      <td className="py-2 px-3">$499</td>
                      <td className="py-2 px-3">Up-front Stripe payment. Unlocks a step-by-step document-upload dashboard.</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3">Loan Brokering</td>
                      <td className="py-2 px-3">1 % of funded loan</td>
                      <td className="py-2 px-3">Collected at closing through loan costs; no up-front payment.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-700">Promo codes may reduce the price—including to $0—at BLA’s discretion. Prices are shown inclusive of any applicable taxes.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">4. No Refunds</h2>
              <p className="text-gray-700">All payments are non-refundable. Because our analyses and dashboards begin processing immediately and deliver digital value, you waive any right to a refund once payment is completed.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">5. User Accounts & Security</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Authentication is provided through Supabase Auth (email/password or Google Sign-In).</li>
                <li>You are responsible for safeguarding login credentials and all activity under your account.</li>
                <li>BLA may suspend or delete any account, without prior notice, for violation of these Terms or unlawful activity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">6. User-Provided Content</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><span className="font-medium">Financial Data & Documents.</span> You may upload financial statements, tax returns, and other documents in the Loan Packaging dashboard.</li>
                <li><span className="font-medium">Ownership.</span> You retain full ownership of all data and of any PDFs the platform generates.</li>
                <li><span className="font-medium">License to BLA.</span> You grant BLA a limited license to store, back up, and display your uploads within your account solely to operate the Services. We do not publicly display or sell your content.</li>
                <li><span className="font-medium">Prohibited Uploads.</span> You agree not to upload content that is illegal, defamatory, or infringes third-party rights, or to attempt to reverse-engineer, scrape, or copy the platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">7. Generated Reports</h2>
              <p className="text-gray-700">Generated PDFs and on-screen analytics are informational tools only. They do not guarantee loan approval or funding success.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">8. Prohibited Uses</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Reverse-engineer, decompile, or disassemble any part of the Services.</li>
                <li>Access the Site via bots or automated scraping.</li>
                <li>Transmit malware, harmful code, or false financial data.</li>
                <li>Use the Services for any unlawful or fraudulent purpose.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">9. Disclaimers</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><span className="font-medium">No Financial or Legal Advice.</span> BLA is not a CPA, financial advisor, or attorney. All outputs are for informational purposes. You should consult qualified professionals before making financial decisions.</li>
                <li><span className="font-medium">No Approval Guarantee.</span> BLA does not guarantee loan approval, specific terms, or funding amounts.</li>
                <li><span className="font-medium">Service “As Is.”</span> The Services are provided “as is” and “as available” without warranties of any kind.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">10. Limitation of Liability</h2>
              <p className="text-gray-700">To the maximum extent allowed by law, BLA’s total cumulative liability for any claim arising out of or relating to the Services is limited to the greater of (a) $100 or (b) the total fees you paid to BLA in the 12 months prior to the event giving rise to the claim. BLA will not be liable for indirect, incidental, special, or consequential damages.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">11. Dispute Resolution & Governing Law</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><span className="font-medium">Governing Law.</span> These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law rules.</li>
                <li><span className="font-medium">Informal Resolution.</span> Contact <a href="mailto:jonathan@businesslendingadvocate.com" className="text-blue-700 underline">jonathan@businesslendingadvocate.com</a> to attempt good-faith resolution first.</li>
                <li><span className="font-medium">Binding Arbitration.</span> Any dispute not resolved informally will be settled by binding arbitration in Bexar County, Texas, administered by the American Arbitration Association under its Commercial Rules. You and BLA waive any right to a jury trial or to participate in a class action. Judgment on the award may be entered in any court with jurisdiction.</li>
                <li><span className="font-medium">Small-Claims Option.</span> Either party may pursue an eligible claim in a U.S. small-claims court instead of arbitration.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">12. Termination</h2>
              <p className="text-gray-700">You may stop using the Services at any time. We may suspend or terminate access immediately if you breach these Terms or engage in unlawful conduct. Sections that by their nature should survive—ownership, disclaimers, limitation of liability, dispute resolution—will survive termination.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">13. Modifications to the Services or Terms</h2>
              <p className="text-gray-700">We may change the Services or these Terms at any time. Material changes will be emailed to registered users at least 10 days before taking effect. Continued use after the effective date constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-6">14. Contact Information</h2>
              <address className="not-italic text-gray-700">
                <div className="font-medium">Questions about these Terms?</div>
                <div>Jonathan Aranda</div>
                <div>Email: <a href="mailto:jonathan@businesslendingadvocate.com" className="text-blue-700 underline">jonathan@businesslendingadvocate.com</a></div>
                <div>Address: 7113 San Pedro Ave., Unit #200, San Antonio, TX 78216</div>
              </address>
            </section>

            <div className="pt-6 text-center text-gray-500 text-sm">Thank you for choosing Business Lending Advocate—your trusted partner in preparing lender-ready financial insights.</div>
          </div>
        </section>
      </main>
    </>
  );
}
