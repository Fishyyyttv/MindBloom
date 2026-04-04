import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function PrivacyPage() {
  const updated = 'April 4, 2026'

  return (
    <div className="min-h-screen bg-cream">
      <nav className="border-b border-sage-100 bg-cream/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sage-400 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-xl text-charcoal">MindBloom</span>
          </Link>
          <Link href="/terms" className="text-sm text-sage-600 hover:underline">Terms of Service →</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl text-charcoal mb-2">Privacy Policy</h1>
        <p className="text-muted text-sm">Last updated: {updated}</p>
        <p className="text-muted text-sm mt-1">Effective date: {updated}</p>

        <div className="mt-4 bg-sage-50 border border-sage-200 rounded-xl px-5 py-4 text-sm text-sage-800 leading-relaxed">
          Your privacy matters deeply to us. MindBloom is a mental wellness app — we understand the sensitivity of the information you share here, and we treat it with the utmost care and respect.
        </div>

        <div className="mt-10 space-y-10 text-charcoal">

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">1. Who we are</h2>
            <p className="text-muted leading-relaxed">MindBloom is a digital wellness application. References to "we," "us," or "our" refer to MindBloom and its operators. For privacy-related inquiries, contact us at <a href="mailto:privacy@mindbloom.app" className="text-sage-600 hover:underline">privacy@mindbloom.app</a>.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">2. Information we collect</h2>
            <p className="text-muted leading-relaxed mb-3">We collect only what is necessary to provide you with the MindBloom service.</p>

            <h3 className="font-semibold text-charcoal mb-2">Information you provide directly</h3>
            <ul className="list-disc list-inside text-muted space-y-1.5 ml-2 mb-4">
              <li>Account information (name, email address) collected via Clerk authentication</li>
              <li>Journal entries and diary content you write</li>
              <li>Mood logs, emotion check-ins, and intensity ratings</li>
              <li>Worksheet responses and skill session data</li>
              <li>Conversations with the Bloom AI companion</li>
            </ul>

            <h3 className="font-semibold text-charcoal mb-2">Information collected automatically</h3>
            <ul className="list-disc list-inside text-muted space-y-1.5 ml-2 mb-4">
              <li>Session and authentication tokens (managed by Clerk)</li>
              <li>Basic usage data (pages visited, features used) for app improvement</li>
              <li>Subscription and billing status (managed by Stripe — we never see your card details)</li>
              <li>Error logs and performance data for debugging</li>
            </ul>

            <h3 className="font-semibold text-charcoal mb-2">Information we do NOT collect</h3>
            <ul className="list-disc list-inside text-muted space-y-1.5 ml-2">
              <li>Payment card numbers or banking information (handled entirely by Stripe)</li>
              <li>Location data</li>
              <li>Device contacts, camera, or microphone access</li>
              <li>Data from third-party apps or social media</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">3. How we use your information</h2>
            <p className="text-muted leading-relaxed mb-3">We use the information we collect for the following purposes only:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 ml-2">
              <li>Providing and operating the MindBloom service</li>
              <li>Maintaining your conversation history and journal entries</li>
              <li>Processing subscription payments via Stripe</li>
              <li>Sending account-related emails (receipts, trial reminders, important updates)</li>
              <li>Detecting and preventing abuse, fraud, or policy violations</li>
              <li>Improving the app based on aggregated, anonymized usage patterns</li>
              <li>Responding to your support requests</li>
              <li>Reviewing bug reports and feature requests you submit</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3"><strong>We never use your mental health data, journal entries, or conversation history for advertising, marketing profiling, or sale to third parties.</strong></p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">4. AI conversations & data processing</h2>
            <p className="text-muted leading-relaxed">When you chat with Bloom, your messages are sent to Groq (our AI inference provider) to generate responses using Meta's Llama 3.3 70B model. Please be aware that:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>Messages are transmitted to Groq's API over encrypted connections</li>
              <li>Groq's data processing is governed by their own privacy policy</li>
              <li>Conversation history is stored in our database (Supabase) to maintain context across sessions</li>
              <li>We do not use your conversations for advertising profiles or sale; provider-side processing remains subject to provider terms</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">We strongly recommend not sharing highly sensitive personal identifiers (Social Security numbers, financial account numbers, etc.) in the chat.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">5. Data storage & security</h2>
            <p className="text-muted leading-relaxed">We take security seriously, especially given the sensitive nature of mental health data.</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li><strong>Encryption in transit:</strong> All data is transmitted over TLS/HTTPS</li>
              <li><strong>Encryption at rest:</strong> Data is stored encrypted in Supabase (PostgreSQL)</li>
              <li><strong>Row-level security:</strong> Database policies ensure each user can only access their own data</li>
              <li><strong>Authentication:</strong> Managed by Clerk, which implements industry-standard security practices including MFA support</li>
              <li><strong>Payment security:</strong> Payment data is handled entirely by Stripe and never touches our servers</li>
              <li><strong>Access controls:</strong> We limit internal access to user data to what is strictly necessary</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">While we implement strong security measures, no system is 100% secure. We encourage you to use a strong, unique password and enable two-factor authentication where available.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">6. Third-party services</h2>
            <p className="text-muted leading-relaxed mb-3">MindBloom uses the following third-party services to operate. Each has their own privacy policy:</p>
            <div className="space-y-3">
              {[
                { name: 'Clerk', role: 'User authentication and account management', url: 'https://clerk.com/privacy' },
                { name: 'Stripe', role: 'Payment processing and subscription management', url: 'https://stripe.com/privacy' },
                { name: 'Supabase', role: 'Database storage (PostgreSQL)', url: 'https://supabase.com/privacy' },
                { name: 'Groq', role: 'AI inference for Bloom conversations', url: 'https://groq.com/privacy-policy' },
                { name: 'Vercel', role: 'Application hosting and deployment', url: 'https://vercel.com/legal/privacy-policy' },
              ].map(s => (
                <div key={s.name} className="bg-sage-50 border border-sage-100 rounded-xl px-4 py-3 text-sm">
                  <span className="font-medium text-charcoal">{s.name}</span>
                  <span className="text-muted"> — {s.role}. </span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:underline">Privacy policy →</a>
                </div>
              ))}
            </div>
            <p className="text-muted leading-relaxed mt-3">We do not sell, rent, or share your personal information with any other third parties.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">7. Data retention</h2>
            <p className="text-muted leading-relaxed">We retain data only as long as needed to operate the service and meet legal/security obligations. Specifically:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>Active accounts: data is retained to provide your account history and features</li>
              <li>If you request deletion: we delete associated account data as part of the deletion workflow, except where retention is legally required</li>
              <li>Security and abuse-prevention logs may be retained for compliance and operational integrity</li>
              <li>De-identified or aggregated analytics may be retained longer</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">8. Your rights & choices</h2>
            <p className="text-muted leading-relaxed mb-3">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 ml-2">
              <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
              <li><strong>Withdraw consent:</strong> Cancel your subscription at any time</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">To exercise any of these rights, email us at <a href="mailto:privacy@mindbloom.app" className="text-sage-600 hover:underline">privacy@mindbloom.app</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">9. Children's privacy</h2>
            <p className="text-muted leading-relaxed">MindBloom is not intended for, and does not knowingly collect personal information from, anyone under the age of 18. If we learn that we have collected personal data from a minor, we will delete it immediately. If you believe a minor has provided us with personal information, please contact us at <a href="mailto:privacy@mindbloom.app" className="text-sage-600 hover:underline">privacy@mindbloom.app</a>.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">10. Cookies & local storage</h2>
            <p className="text-muted leading-relaxed">MindBloom uses minimal cookies and browser local storage:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>Authentication cookies set by Clerk to maintain your session</li>
              <li>Local storage to remember app preferences (e.g. whether you've completed onboarding)</li>
              <li>No advertising or tracking cookies of any kind</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">11. Not a HIPAA-covered entity</h2>
            <p className="text-muted leading-relaxed">MindBloom is a wellness application, not a healthcare provider, health plan, or healthcare clearinghouse. We are not subject to the Health Insurance Portability and Accountability Act (HIPAA). Do not use MindBloom as a substitute for protected health information storage or professional medical records.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">12. International users</h2>
            <p className="text-muted leading-relaxed">MindBloom is operated in the United States. If you are accessing MindBloom from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States. By using MindBloom, you consent to this transfer.</p>
            <p className="text-muted leading-relaxed mt-3">If you are located in the European Economic Area (EEA), United Kingdom, or other regions with data protection laws, you may have additional rights under applicable law (such as GDPR). Contact us at <a href="mailto:privacy@mindbloom.app" className="text-sage-600 hover:underline">privacy@mindbloom.app</a> to exercise these rights.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">13. Changes to this policy</h2>
            <p className="text-muted leading-relaxed">We may update this Privacy Policy from time to time. We will notify you of significant changes by email and by updating the "Last updated" date at the top of this page. We encourage you to review this policy periodically. Continued use of MindBloom after changes are posted constitutes your acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">14. Contact us</h2>
            <p className="text-muted leading-relaxed">If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us:</p>
            <div className="mt-3 bg-sage-50 border border-sage-100 rounded-xl px-5 py-4 text-sm text-muted space-y-1">
              <p><strong className="text-charcoal">MindBloom Privacy Team</strong></p>
              <p>Email: <a href="mailto:privacy@mindbloom.app" className="text-sage-600 hover:underline">privacy@mindbloom.app</a></p>
              <p>General: <a href="mailto:hello@mindbloom.app" className="text-sage-600 hover:underline">hello@mindbloom.app</a></p>
              <p className="pt-1 text-xs">We aim to respond to all privacy requests within 30 days.</p>
            </div>
          </section>

        </div>
      </div>

      <footer className="border-t border-sage-100 py-6 px-6 text-center text-xs text-muted">
        <div className="flex justify-center gap-6">
          <Link href="/privacy" className="hover:text-charcoal transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-charcoal transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-charcoal transition-colors">Back to MindBloom</Link>
        </div>
      </footer>
    </div>
  )
}
