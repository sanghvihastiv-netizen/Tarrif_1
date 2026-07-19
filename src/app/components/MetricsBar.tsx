'use client';

import { useEffect, useState } from 'react';

interface NewsMetrics {
  tariffIndex: number;
  supplyChainIndex: number;
  nearshoringIndex: number;
  chokepointRisk: string;
  alertText: string;
  headlines: Array<{ title: string; source: string; category: string; url?: string }>;
  summary: string;
  keyRisks: string[];
  opportunities: string[];
  lastUpdated: string;
  _debug?: any;
}

export default function MetricsBar() {
  const [time, setTime] = useState('');
  const [metrics, setMetrics] = useState<NewsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 60000);

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📡 Fetching trade intelligence...');
        const response = await fetch('/api/news');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch');
        }
        
        const data = await response.json();
        console.log('✅ Trade intelligence received');
        setMetrics(data);
      } catch (err) {
        console.error('❌ Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const refreshInterval = setInterval(fetchMetrics, 300000); // 5 minutes

    return () => {
      clearInterval(timeInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-red-400';
      case 'MEDIUM': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getRiskBgColor = (risk: string) => {
    switch(risk) {
      case 'CRITICAL': return 'bg-red-500/20 border-red-500/30';
      case 'HIGH': return 'bg-red-500/10 border-red-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-green-500/10 border-green-500/20';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch(category) {
      case 'tariff': return '💰';
      case 'shipping': return '🚢';
      case 'trade': return '🌐';
      case 'supplychain': return '🔗';
      default: return '📰';
    }
  };

  return (
    <div className="border-y border-white/10 bg-black/40 backdrop-blur-sm py-4 md:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 via-white/4 to-transparent p-4 md:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${error ? 'border-red-500/20 bg-red-500/10 text-red-400' : loading ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
                <span className={`h-2 w-2 rounded-full ${loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                {loading ? 'ANALYZING' : error ? 'ERROR' : 'LIVE'}
              </div>
              <div className="text-sm text-gray-400">
                <span className="font-mono text-gray-300">{time || '--:--'} UTC</span>
                {metrics && <span className="ml-2 text-gray-500">• AI Analysis</span>}
              </div>
            </div>

            <div className={`hidden md:flex items-center gap-2 rounded-full border px-3 py-1.5 ${error ? 'border-red-500/20 bg-red-500/10' : metrics ? getRiskBgColor(metrics.chokepointRisk) : 'border-white/10 bg-white/5'}`}>
              <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${error ? 'bg-red-500' : metrics ? metrics.chokepointRisk === 'CRITICAL' ? 'bg-red-600' : metrics.chokepointRisk === 'HIGH' ? 'bg-amber-400' : 'bg-emerald-400' : 'bg-gray-400'}`} />
              <span className={`text-xs ${error ? 'text-red-400' : metrics ? metrics.chokepointRisk === 'CRITICAL' ? 'text-red-600' : metrics.chokepointRisk === 'HIGH' ? 'text-amber-400' : 'text-emerald-400' : 'text-gray-400'}`}>
                {error ? '⚠️ AI Error' : metrics ? metrics.alertText : 'Monitoring ready'}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Tariff Index</div>
              <div className="mt-1 text-xl font-semibold text-white">{metrics ? metrics.tariffIndex : '...'}</div>
              <div className="text-xs text-red-400">{metrics ? `↑ ${Math.round((metrics.tariffIndex - 100) * 1.5)}%` : 'Loading...'}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Supply Chain</div>
              <div className="mt-1 text-xl font-semibold text-white">{metrics ? metrics.supplyChainIndex : '...'}</div>
              <div className="text-xs text-red-400">{metrics ? `↑ ${Math.round((metrics.supplyChainIndex - 80) * 2)}%` : 'Loading...'}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Nearshoring</div>
              <div className="mt-1 text-xl font-semibold text-white">{metrics ? metrics.nearshoringIndex.toLocaleString() : '...'}</div>
              <div className="text-xs text-emerald-400">{metrics ? `↑ ${Math.round((metrics.nearshoringIndex - 2000) / 20)}%` : 'Loading...'}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Chokepoint Risk</div>
              <div className={`mt-1 text-xl font-semibold ${metrics ? getRiskColor(metrics.chokepointRisk) : 'text-gray-400'}`}>
                {metrics ? metrics.chokepointRisk : '...'}
              </div>
              <div className="text-xs text-red-400">{metrics ? `↑ ${metrics.chokepointRisk === 'CRITICAL' ? '3' : metrics.chokepointRisk === 'HIGH' ? '2' : '1'} levels` : 'Loading...'}</div>
            </div>
          </div>

          {metrics && (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">Market pulse</div>
                <div className="mt-2 text-sm leading-6 text-gray-400">{metrics.summary}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
                >
                  {showDetails ? '▼' : '▶'} {showDetails ? 'Hide' : 'Show'} risks & opportunities
                </button>

                {showDetails && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {metrics.keyRisks && metrics.keyRisks.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">Risks</div>
                        <ul className="mt-2 space-y-1.5">
                          {metrics.keyRisks.map((risk, i) => (
                            <li key={i} className="text-sm text-gray-400">• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {metrics.opportunities && metrics.opportunities.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Opportunities</div>
                        <ul className="mt-2 space-y-1.5">
                          {metrics.opportunities.map((opp, i) => (
                            <li key={i} className="text-sm text-gray-400">• {opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {metrics && metrics.headlines && metrics.headlines.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-4">
                <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">AI Insights</span>
                <div className="flex-1 overflow-hidden">
                  <div className="animate-marquee whitespace-nowrap">
                    {metrics.headlines.map((headline, idx) => (
                      <a
                        key={idx}
                        href={headline.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="mx-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
                      >
                        <span>{getCategoryEmoji(headline.category)}</span>
                        <span>{headline.title}</span>
                        <span className="text-gray-600">— {headline.source}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}