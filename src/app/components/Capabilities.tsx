'use client';


export default function Capabilities() {
  const capabilities = [
    {
      title: 'Carrier Reliability Scoring',
      description: 'Compare carriers by on-time performance, delay history, and disruption exposure before booking a lane.',
      icon: '📈',
    },
    {
      title: 'Route Risk Intelligence',
      description: 'Track port congestion, weather, strikes, sanctions, and other events that can slow a voyage.',
      icon: '🌍',
    },
    {
      title: 'Transit vs Cost Decisioning',
      description: 'Weigh transit time, surcharges, and total trip cost side by side to protect service levels and margin.',
      icon: '⚖️',
    },
    {
      title: 'Shipping Line Event Watch',
      description: 'Monitor schedules, service alerts, and future disruptions that could change the reliability of a route.',
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
            A command center for <span className="text-amber-400">route decisions</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Decision support built for operators who need reliable shipping options, not just raw pricing data.
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
            <div className="text-2xl">⏱️</div>
            <div>
              <div className="text-sm font-medium">Transit Time</div>
              <div className="text-xs text-gray-500">Compare route duration at a glance</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl">🚨</div>
            <div>
              <div className="text-sm font-medium">Delay Alerts</div>
              <div className="text-xs text-gray-500">Live disruption monitoring</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl">📦</div>
            <div>
              <div className="text-sm font-medium">Trip Economics</div>
              <div className="text-xs text-gray-500">Reliability + price + time in one view</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



