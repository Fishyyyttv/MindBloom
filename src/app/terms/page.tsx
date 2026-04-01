import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function TermsPage() {
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

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
          <Link href="/privacy" className="text-sm text-sage-600 hover:underline">Privacy Policy →</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl text-charcoal mb-2">Terms of Service</h1>
        <p className="text-muted text-sm">Last updated: {updated}</p>
        <p className="text-muted text-sm mt-1">Effective date: {updated}</p>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800 leading-relaxed">
          <strong>Please read these terms carefully.</strong> By creating an account or using MindBloom, you agree to be bound by these Terms of Service. If you do not agree, do not use MindBloom.
        </div>

        <div className="mt-10 space-y-10 text-charcoal">

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">1. About MindBloom</h2>
            <p className="text-muted leading-relaxed">MindBloom is a digital wellness application that provides an AI-powered conversational companion, journaling tools, mood tracking, breathing exercises, grounding techniques, and evidence-informed psychoeducational content based on approaches such as Cognitive Behavioral Therapy (CBT) and Dialectical Behavior Therapy (DBT).</p>
            <p className="text-muted leading-relaxed mt-3">MindBloom is operated as an independent wellness product. References to "we," "us," or "our" refer to MindBloom and its operators.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">2. Not a medical or mental health service</h2>
            <p className="text-muted leading-relaxed">MindBloom is <strong>not</strong> a licensed mental health service, medical provider, or crisis service. The AI companion ("Bloom") is not a licensed therapist, psychologist, psychiatrist, counselor, or any other mental health professional.</p>
            <p className="text-muted leading-relaxed mt-3">MindBloom does not:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>Provide medical advice, diagnosis, or treatment</li>
              <li>Replace or substitute professional mental health care</li>
              <li>Constitute a therapeutic relationship between you and any licensed provider</li>
              <li>Provide emergency or crisis intervention services</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">Always seek the advice of a qualified mental health professional with any questions you have regarding a mental health condition. <strong>If you are experiencing a mental health crisis, suicidal thoughts, or are in immediate danger, call or text 988 (Suicide & Crisis Lifeline) or call 911 immediately.</strong></p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">3. Eligibility</h2>
            <p className="text-muted leading-relaxed">You must be at least <strong>18 years of age</strong> to create an account and use MindBloom. By registering, you represent and warrant that:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>You are 18 years of age or older</li>
              <li>You have the legal capacity to enter into a binding agreement</li>
              <li>You are not prohibited from using the service under any applicable law</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">MindBloom is not intended for use by minors. If we become aware that a user is under 18, we will terminate their account immediately.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">4. Account registration & security</h2>
            <p className="text-muted leading-relaxed">You must create an account to use MindBloom. You agree to:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>Provide accurate and complete registration information</li>
              <li>Keep your login credentials confidential</li>
              <li>Not share your account with any other person</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">You are responsible for all activity that occurs under your account. We are not liable for any loss or damage arising from your failure to protect your credentials.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">5. Subscription & billing</h2>
            <p className="text-muted leading-relaxed">MindBloom is offered on a subscription basis at <strong>$9.99 per month</strong>, billed monthly. A <strong>7-day free trial</strong> is available to new users. The following terms apply:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>No charge will be made during the 7-day trial period</li>
              <li>You may cancel at any time before the trial ends without being charged</li>
              <li>After the trial, your payment method will be charged $9.99/month automatically</li>
              <li>Subscriptions renew automatically each month unless canceled</li>
              <li>Free trials are limited to one per person — creating multiple accounts to obtain additional trials is prohibited</li>
              <li>We do not offer refunds for partial billing periods</li>
              <li>Prices may change with 30 days advance notice</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">Payments are processed securely by Stripe. We do not store your payment card details.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">6. Cancellation</h2>
            <p className="text-muted leading-relaxed">You may cancel your subscription at any time through the billing portal accessible from within the app. Upon cancellation:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>You will retain access to MindBloom until the end of your current billing period</li>
              <li>No further charges will be made</li>
              <li>Your data will be retained for 90 days after cancellation, after which it may be deleted</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">7. Acceptable use</h2>
            <p className="text-muted leading-relaxed">You agree to use MindBloom only for lawful, personal wellness purposes. You must not:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>Use MindBloom to harass, threaten, or harm yourself or others</li>
              <li>Attempt to reverse-engineer, decompile, or extract source code from MindBloom</li>
              <li>Use automated tools, bots, or scripts to access the service</li>
              <li>Attempt to bypass rate limits, subscription gates, or security measures</li>
              <li>Misrepresent your identity or create accounts on behalf of others</li>
              <li>Use MindBloom for any commercial purpose without our written consent</li>
              <li>Upload or transmit malicious code or content</li>
              <li>Violate any applicable local, state, national, or international law</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">We reserve the right to suspend or terminate accounts that violate these terms at our sole discretion.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">8. AI-generated content</h2>
            <p className="text-muted leading-relaxed">MindBloom uses a large language model (Meta Llama 3.3 70B) to power the Bloom companion. You acknowledge that:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>AI-generated responses may be inaccurate, incomplete, or inappropriate</li>
              <li>Bloom's responses do not constitute professional advice of any kind</li>
              <li>You should not rely solely on Bloom for mental health decisions</li>
              <li>AI conversations are logged to improve the service and maintain session history</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">9. Intellectual property</h2>
            <p className="text-muted leading-relaxed">All content, design, code, and materials within MindBloom — excluding content you create — are owned by or licensed to MindBloom and are protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without our express written permission.</p>
            <p className="text-muted leading-relaxed mt-3">Content you create within MindBloom (journal entries, worksheet responses, etc.) remains yours. By using MindBloom, you grant us a limited license to store and process this content solely to provide the service to you.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">10. Disclaimer of warranties</h2>
            <p className="text-muted leading-relaxed">MindBloom is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of any kind, either express or implied. We do not warrant that:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>The service will be uninterrupted, error-free, or secure</li>
              <li>Any information provided by Bloom will be accurate or complete</li>
              <li>The service will meet your specific needs or expectations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">11. Limitation of liability</h2>
            <p className="text-muted leading-relaxed">To the fullest extent permitted by law, MindBloom and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
            <ul className="list-disc list-inside text-muted space-y-1.5 mt-2 ml-2">
              <li>Harm arising from reliance on AI-generated content</li>
              <li>Mental health outcomes or decisions made using MindBloom</li>
              <li>Loss of data, revenue, or profits</li>
              <li>Unauthorized access to your account or data</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">Our total liability to you for any claim shall not exceed the amount you paid to us in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">12. Changes to these terms</h2>
            <p className="text-muted leading-relaxed">We may update these Terms of Service from time to time. When we do, we will update the "Last updated" date at the top of this page. Continued use of MindBloom after changes constitutes acceptance of the updated terms. We will make reasonable efforts to notify you of material changes via email.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">13. Governing law</h2>
            <p className="text-muted leading-relaxed">These terms are governed by and construed in accordance with the laws of the United States. Any disputes arising from these terms or your use of MindBloom shall be resolved through binding arbitration, except where prohibited by law.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-3">14. Contact</h2>
            <p className="text-muted leading-relaxed">If you have questions about these Terms of Service, please contact us:</p>
            <div className="mt-3 bg-sage-50 border border-sage-100 rounded-xl px-5 py-4 text-sm text-muted space-y-1">
              <p><strong className="text-charcoal">MindBloom</strong></p>
              <p>Email: <a href="mailto:hello@mindbloom.app" className="text-sage-600 hover:underline">hello@mindbloom.app</a></p>
              <p>Legal: <a href="mailto:legal@mindbloom.app" className="text-sage-600 hover:underline">legal@mindbloom.app</a></p>
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