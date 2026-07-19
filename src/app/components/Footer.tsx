'use client';


export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 bg-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-xl font-bold tracking-tight mb-2">
              Tariff<span className="text-amber-500">Wars</span>
            </div>
            <p className="text-xs text-gray-500">Live shipping intelligence engine</p>
          </div>


          <div>
            <h4 className="text-sm font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#" className="hover:text-white transition">Simulator</a></li>
              <li><a href="#" className="hover:text-white transition">Scenarios</a></li>
              <li><a href="#" className="hover:text-white transition">API</a></li>
              <li><a href="#" className="hover:text-white transition">Reliability</a></li>
            </ul>
          </div>


          <div>
            <h4 className="text-sm font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#" className="hover:text-white transition">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition">Case Studies</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Status</a></li>
            </ul>
          </div>


          <div>
            <h4 className="text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms</a></li>
              <li><a href="#" className="hover:text-white transition">Security</a></li>
            </ul>
          </div>
        </div>


        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-white/10">
          <p className="text-xs text-gray-500">© 2026 Tariff Wars. All rights reserved.</p>
          <div className="flex gap-4 mt-3 sm:mt-0">
            <a href="#" className="text-gray-500 hover:text-white transition">🐦</a>
            <a href="#" className="text-gray-500 hover:text-white transition">🔗</a>
            <a href="#" className="text-gray-500 hover:text-white transition">🐙</a>
            <a href="#" className="text-gray-500 hover:text-white transition">✉️</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

