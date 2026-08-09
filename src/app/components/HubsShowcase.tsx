'use client';

const countryInsights = [
  {
    name: 'United States',
    flag: '🇺🇸',
    headline: 'Section 301 and antidumping exposure',
    details: ['Higher tariff risk on sensitive categories', 'Regional duty exemptions may apply in specific programs'],
  },
  {
    name: 'Mexico',
    flag: '🇲🇽',
    headline: 'Nearshoring tariff advantages',
    details: ['USMCA preference can reduce duty exposure', 'Origin rules still matter for qualification'],
  },
  {
    name: 'India',
    flag: '🇮🇳',
    headline: 'Trade-policy variability',
    details: ['HS-code driven tariff treatment', 'Additional taxes can apply beyond base import duty'],
  },
  {
    name: 'European Union',
    flag: '🇪🇺',
    headline: 'Tariff classifications and VAT impact',
    details: ['Duty rates depend on product classification', 'VAT and customs fees can materially change total landed cost'],
  },
  {
    name: 'Singapore',
    flag: '🇸🇬',
    headline: 'Low-duty trade profile',
    details: ['Competitive import framework', 'Often favorable for low-complexity duty scenarios'],
  },
  {
    name: 'China',
    flag: '🇨🇳',
    headline: 'Tariff and trade-risk sensitivity',
    details: ['Sensitive categories may face higher duties', 'Policy changes can shift effective landed cost quickly'],
  },
  {
    name: 'United Kingdom',
    flag: '🇬🇧',
    headline: 'Post-Brexit tariff lens',
    details: ['Tariff treatment depends on origin and classification', 'Customs and VAT are major cost factors'],
  },
  {
    name: 'Japan',
    flag: '🇯🇵',
    headline: 'Stable trade regime with product-specific duties',
    details: ['Duty exposure is linked to HS classification', 'Exemption rules may vary by use case and sourcing origin'],
  },
];

export default function HubsShowcase() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Country <span className="text-amber-400">tax & tariff signals</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Review the tax and tariff environment behind each market before you calculate landed cost.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {countryInsights.map((country) => (
            <div
              key={country.name}
              className="relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm rounded-xl border border-white/10 p-5 transition-all duration-300 hover:scale-[1.02] hover:border-amber-500/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{country.flag}</div>
                <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-0.5">
                  <span className="text-[10px] text-gray-300">{country.name}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1">{country.name}</h3>
              <p className="text-base font-semibold text-amber-400 mb-3">{country.headline}</p>
              <div className="space-y-1.5">
                {country.details.map((detail, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

