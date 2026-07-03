'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#06040A] text-gray-300 font-sans selection:bg-purple-500/30">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 bg-[#06040A]/80 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="font-bold text-xl text-white tracking-tight">brainrot.ai</Link>
        <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          &larr; Back to Home
        </Link>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to Brainrot Video Automator ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and share your information when you use our application and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            <p className="mb-3">We collect several different types of information for various purposes to provide and improve our service to you:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li><strong>Personal Data:</strong> Email address, first name and last name, and authentication tokens (e.g., from YouTube and Instagram OAuth).</li>
              <li><strong>Usage Data:</strong> Information on how the service is accessed and used, including processing jobs and generated video metadata.</li>
              <li><strong>Third-Party Integrations:</strong> When you connect your YouTube or Instagram accounts, we store secure OAuth tokens to publish videos on your behalf. We only request the minimum scopes required to perform these actions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
            <p className="mb-3">We use the collected data for various purposes:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>To provide and maintain our service</li>
              <li>To automatically generate and schedule short-form videos on your linked platforms</li>
              <li>To notify you about changes to our service</li>
              <li>To provide customer support and troubleshoot issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services</h2>
            <p>
              Our service interacts with third-party APIs including Google (Gemini, YouTube Data API) and Meta (Instagram Graph API). By using our service, you also agree to be bound by the respective Terms of Service and Privacy Policies of these platforms. We do not sell your personal data to any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. We use industry-standard security measures (such as Row Level Security via Supabase) to protect your personal information, but we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us by creating an issue on our official GitHub repository.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} Brainrot Video Automator. All rights reserved.
      </footer>
    </div>
  );
}
