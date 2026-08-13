import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions | TariffWars',
  description: 'Terms and conditions for using the TariffWars application.',
};

const sections = [
  ['Service description', 'TariffWars provides trade, shipment, tariff, and landed-cost estimates for informational and planning purposes. The service does not provide legal, tax, customs, accounting, or financial advice.'],
  ['Accounts', 'You must provide accurate account information, keep your credentials secure, and notify us if you believe your account has been compromised. You are responsible for activity performed through your account.'],
  ['Tax and tariff estimates', 'Rates may be extracted from automated services, retrieved from previously stored records, entered manually, or calculated using clearly identified estimated defaults. Rates and calculations may be incomplete, delayed, or inaccurate and must be verified with an appropriate customs or tax authority before you rely on them.'],
  ['Acceptable use', 'You may not misuse the application, attempt unauthorized access, disrupt the service, upload malicious content, or use the service in violation of applicable laws or regulations.'],
  ['User-provided information', 'You are responsible for shipment details and tax rates that you enter. Do not submit confidential information unless it is necessary for the calculation and you are authorized to provide it.'],
  ['Availability', 'The application may be changed, suspended, or unavailable without notice. We do not guarantee uninterrupted operation or that third-party services will always be available.'],
  ['Limitation of liability', 'To the extent permitted by law, TariffWars and its operators are not liable for losses arising from reliance on estimates, inaccurate rates, service interruptions, or decisions made using the application.'],
  ['Changes to these terms', 'These terms may be updated as the application evolves. Continued use after an update means that you accept the revised terms.'],
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white sm:px-8">
      <article className="mx-auto max-w-3xl">
        <Link href="/signup" className="text-sm text-amber-400 transition hover:text-amber-300">← Back to signup</Link>
        <header className="mt-8 border-b border-white/10 pb-8">
          <Link href="/" className="text-xl font-bold tracking-tight">Tariff<span className="text-amber-500">Wars</span></Link>
          <h1 className="mt-6 text-4xl font-bold">Terms and Conditions</h1>
          <p className="mt-3 text-sm text-gray-400">Effective date: 13 August 2026</p>
          <p className="mt-5 leading-7 text-gray-300">By creating an account or using TariffWars, you agree to these terms. Please read them before continuing.</p>
        </header>

        <div className="space-y-8 py-8">
          {sections.map(([title, content], index) => (
            <section key={title}>
              <h2 className="text-xl font-semibold text-white">{index + 1}. {title}</h2>
              <p className="mt-3 leading-7 text-gray-300">{content}</p>
            </section>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8">
          <Link href="/signup" className="inline-flex rounded-lg bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400">Return to signup</Link>
        </div>
      </article>
    </main>
  );
}
