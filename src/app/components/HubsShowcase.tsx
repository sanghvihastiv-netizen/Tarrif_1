'use client';


const hubs = [
  { name: 'China', labor: '$6.50/hr', flag: '🇨🇳', specialties: ['Scale & infrastructure', 'Skilled labor pool'] },
  { name: 'India', labor: '$2.10/hr', flag: '🇮🇳', specialties: ['China+1 hedge', 'IT integration'] },
  { name: 'Vietnam', labor: '$3.00/hr', flag: '🇻🇳', specialties: ['China+1 hedge', 'Electronics'] },
  { name: 'Bangladesh', labor: '$1.40/hr', flag: '🇧🇩', specialties: ['Lowest textile cost', 'Garments'] },
  { name: 'Mexico', labor: '$4.80/hr', flag: '🇲🇽', specialties: ['USMCA nearshoring', 'Auto parts'] },
  { name: 'UAE', labor: '$7.20/hr', flag: '🇦🇪', specialties: ['Logistics gateway', 'Energy hub'] },
  { name: 'Germany', labor: '$48.00/hr', flag: '🇩🇪', specialties: ['Precision engineering', 'Auto'] },
  { name: 'USA', labor: '$32.00/hr', flag: '🇺🇸', specialties: ['IRA & CHIPS subsidies', 'Tech'] },
];


export default function HubsShowcase() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Manufacturing <span className="text-amber-400">Hubs</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Where the world makes things — eight production geographies, calibrated with live labor and trade data.
          </p>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {hubs.map((hub) => (
            <div
              key={hub.name}
              className="relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm rounded-xl border border-white/10 p-5 transition-all duration-300 hover:scale-[1.02] hover:border-amber-500/30 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{hub.flag}</div>
                <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-0.5">
                  <span className="text-[10px] text-gray-300">{hub.name}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1">{hub.name}</h3>
              <p className="text-2xl font-bold text-amber-400 mb-3">{hub.labor}</p>
              <div className="space-y-1.5">
                {hub.specialties.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                    {spec}
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

