'use client';

import { useEffect, useState } from 'react';

interface NewsMetrics {
  tariffIndex: number;
  supplyChainIndex: number;
  nearshoringIndex: number;
  chokepointRisk: string;
  alertText: string;
  headlines: Array<{ title: string; source: string; category: string }>;
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
    <div className="border-y border-white/10 bg-black/40 backdrop-blur-sm py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
              <span className={`text-xs font-mono ${loading ? 'text-yellow-400' : error ? 'text-red-400' : 'text-green-400'}`}>
                {loading ? 'ANALYZING' : error ? 'ERROR' : 'LIVE'}
              </span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-xs text-gray-400 font-mono">{time} UTC</span>
            {metrics && (
              <>
                <div className="h-4 w-px bg-white/20" />
                <span className="text-xs text-gray-500 font-mono">
                  🤖 AI Analysis
                </span>
              </>
            )}
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 min-w-[120px]">
              <div className="text-xs text-gray-400">💰 Tariff Index</div>
              <div className="text-xl font-bold">{metrics ? metrics.tariffIndex : '...'}</div>
              <div className="text-xs text-red-400">
                {metrics ? `↑ ${Math.round((metrics.tariffIndex - 100) * 1.5)}%` : 'Loading...'}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 min-w-[120px]">
              <div className="text-xs text-gray-400">🔗 Supply Chain</div>
              <div className="text-xl font-bold">{metrics ? metrics.supplyChainIndex : '...'}</div>
              <div className="text-xs text-red-400">
                {metrics ? `↑ ${Math.round((metrics.supplyChainIndex - 80) * 2)}%` : 'Loading...'}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 min-w-[120px]">
              <div className="text-xs text-gray-400">🏭 Nearshoring</div>
              <div className="text-xl font-bold">{metrics ? metrics.nearshoringIndex.toLocaleString() : '...'}</div>
              <div className="text-xs text-green-400">
                {metrics ? `↑ ${Math.round((metrics.nearshoringIndex - 2000) / 20)}%` : 'Loading...'}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 min-w-[120px]">
              <div className="text-xs text-gray-400">🚢 Chokepoint Risk</div>
              <div className={`text-xl font-bold ${metrics ? getRiskColor(metrics.chokepointRisk) : 'text-gray-400'}`}>
                {metrics ? metrics.chokepointRisk : '...'}
              </div>
              <div className="text-xs text-red-400">
                {metrics ? `↑ ${metrics.chokepointRisk === 'CRITICAL' ? '3' : metrics.chokepointRisk === 'HIGH' ? '2' : '1'} levels` : 'Loading...'}
              </div>
            </div>
          </div>

          {/* Alert */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${error ? 'bg-red-500/10 border-red-500/20' : metrics ? getRiskBgColor(metrics.chokepointRisk) : 'bg-gray-500/10 border-gray-500/20'}`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${error ? 'bg-red-500' : metrics ? metrics.chokepointRisk === 'CRITICAL' ? 'bg-red-600' : metrics.chokepointRisk === 'HIGH' ? 'bg-amber-400' : 'bg-green-400' : 'bg-gray-400'}`} />
            <span className={`text-xs ${error ? 'text-red-400' : metrics ? metrics.chokepointRisk === 'CRITICAL' ? 'text-red-600' : metrics.chokepointRisk === 'HIGH' ? 'text-amber-400' : 'text-green-400' : 'text-gray-400'}`}>
              {error ? '⚠️ AI Error' : metrics ? metrics.alertText : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Summary & Details */}
        {metrics && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex flex-col gap-2">
              {/* Summary */}
              <div className="text-xs text-gray-400">
                {metrics.summary}
              </div>
              
              {/* Risks & Opportunities toggle */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-amber-400 hover:text-amber-300 transition text-left flex items-center gap-1"
              >
                {showDetails ? '▼' : '▶'} {showDetails ? 'Hide' : 'Show'} risks & opportunities
              </button>

              {showDetails && (
                <div className="flex flex-wrap gap-4 mt-1">
                  {/* Risks */}
                  {metrics.keyRisks && metrics.keyRisks.length > 0 && (
                    <div>
                      <div className="text-xs text-red-400 font-semibold mb-1">⚠️ Risks</div>
                      <ul className="space-y-1">
                        {metrics.keyRisks.map((risk, i) => (
                          <li key={i} className="text-xs text-gray-400">• {risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Opportunities */}
                  {metrics.opportunities && metrics.opportunities.length > 0 && (
                    <div>
                      <div className="text-xs text-green-400 font-semibold mb-1">✅ Opportunities</div>
                      <ul className="space-y-1">
                        {metrics.opportunities.map((opp, i) => (
                          <li key={i} className="text-xs text-gray-400">• {opp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* News Headlines Ticker */}
        {metrics && metrics.headlines && metrics.headlines.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 overflow-hidden">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-amber-400 whitespace-nowrap">📰 AI INSIGHTS</span>
              <div className="flex-1 overflow-hidden">
                <div className="animate-marquee whitespace-nowrap">
                  {metrics.headlines.map((headline, idx) => (
                    <span key={idx} className="mx-4 text-xs text-gray-400">
                      {getCategoryEmoji(headline.category)} {headline.title} <span className="text-gray-600">— {headline.source}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}