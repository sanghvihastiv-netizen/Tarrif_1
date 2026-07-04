'use client';


export default function Capabilities() {
  const capabilities = [
    {
      title: 'Manufacturing Hub Modeling',
      description: 'Compare 8 production geographies across labor, energy, logistics, and tax incentives.',
      icon: '🏭',
    },
    {
      title: 'Geopolitical Shock Simulation',
      description: 'Inject sanctions, wars, embargoes, and chokepoint closures into your supply graph.',
      icon: '🌍',
    },
    {
      title: 'Tariff Pass-through Engine',
      description: 'Model cost impacts across tiers, suppliers, and final pricing strategies.',
      icon: '📊',
    },
    {
      title: 'Chokepoint Risk Monitor',
      description: 'Track critical maritime chokepoints and get early disruption warnings.',
      icon: '🚢',
    },
  ];


  return (
    <section className="py-20 bg-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-4">
            Capabilities
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            A war room for <span className="text-amber-400">global trade</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Institutional-grade modeling — built for operators, not analysts.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="group relative bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition inline-block">
                {cap.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{cap.title}</h3>
              <p className="text-gray-400 text-sm">{cap.description}</p>
            </div>
          ))}
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl">💰</div>
            <div>
              <div className="text-sm font-medium">Cost per kt</div>
              <div className="text-xs text-gray-500">Dynamic freight modeling</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl">🔌</div>
            <div>
              <div className="text-sm font-medium">Shock API</div>
              <div className="text-xs text-gray-500">Programmatic triggers</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl">⚠️</div>
            <div>
              <div className="text-sm font-medium">Risk Heatmap</div>
              <div className="text-xs text-gray-500">67.0% risk-weighted</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



