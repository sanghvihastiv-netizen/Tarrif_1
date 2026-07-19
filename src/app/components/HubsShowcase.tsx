'use client';


const hubs = [
  { name: 'Singapore', profile: 'High service density', flag: '🇸🇬', specialties: ['Transshipment hub', 'Frequent departures'] },
  { name: 'Rotterdam', profile: 'North Europe gateway', flag: '🇳🇱', specialties: ['Strong liner coverage', 'Port congestion watch'] },
  { name: 'Dubai', profile: 'Middle East connector', flag: '🇦🇪', specialties: ['Strategic rerouting', 'Fast feeder access'] },
  { name: 'Los Angeles', profile: 'West Coast entry point', flag: '🇺🇸', specialties: ['Rail inland access', 'Delay-sensitive routes'] },
  { name: 'Shanghai', profile: 'Global export anchor', flag: '🇨🇳', specialties: ['Massive cargo flow', 'Capacity volatility'] },
  { name: 'Mumbai', profile: 'South Asia gateway', flag: '🇮🇳', specialties: ['Regional feeder links', 'Service variability'] },
  { name: 'Ho Chi Minh City', profile: 'Southeast Asia node', flag: '🇻🇳', specialties: ['Emerging export lane', 'Weather exposure'] },
  { name: 'Mexico City', profile: 'Nearshoring corridor', flag: '🇲🇽', specialties: ['Cross-border timing', 'Intermodal complexity'] },
];


export default function HubsShowcase() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Shipping <span className="text-amber-400">Hubs</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Major gateways and service nodes where reliability, transit time, and delay risk are shaped every day.
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
              <p className="text-2xl font-bold text-amber-400 mb-3">{hub.profile}</p>
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

