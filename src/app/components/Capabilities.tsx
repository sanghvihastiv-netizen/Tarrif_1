'use client';

export default function Capabilities() {
  const capabilities = [
    {
      title: 'Route and product cost estimation',
      description: 'Calculate a complete landed-cost estimate from origin and destination, product value, quantity, and shipping mode.',
      icon: '📦',
    },
    {
      title: 'Tax and duty extraction',
      description: 'Automatically retrieve applicable taxes, duty rules, and rate logic before calculating the final total.',
      icon: '🧠',
    },
    {
      title: 'Clear cost breakdowns',
      description: 'Break down freight, insurance, import duty, taxes, and port charges into clearly itemized line items.',
      icon: '📊',
    },
    {
      title: 'Saved and reviewable results',
      description: 'Keep the results you need, review them later, and save only when you explicitly choose to keep the calculation.',
      icon: '💾',
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
            Built for <span className="text-amber-400">landed-cost decisions</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The platform is focused on practical cost modeling for shipping operations, import planning, and margin protection.
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
            <div className="text-2xl">🚢</div>
            <div>
              <div className="text-sm font-medium">Shipping modes</div>
              <div className="text-xs text-gray-500">Sea, air, and road comparisons</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl">🧾</div>
            <div>
              <div className="text-sm font-medium">Tax logic</div>
              <div className="text-xs text-gray-500">Current rates + stored rule fallback</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl">📁</div>
            <div>
              <div className="text-sm font-medium">Saved results</div>
              <div className="text-xs text-gray-500">Review and keep the right estimates</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



