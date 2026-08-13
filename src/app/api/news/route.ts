import { NextResponse } from 'next/server';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

const defaultHeadlines = [
  {
    title: 'Trade dynamics shifting in 2026',
    source: 'Reuters',
    category: 'trade',
    url: 'https://www.reuters.com/world/'
  },
  {
    title: 'Supply chain resilience becomes key priority',
    source: 'Logistics Today',
    category: 'supplychain',
    url: 'https://www.logisticstoday.com/'
  },
  {
    title: 'Shipping routes face new challenges',
    source: 'Maritime Executive',
    category: 'shipping',
    url: 'https://maritime-executive.com/'
  },
  {
    title: 'Tariff negotiations impact global markets',
    source: 'Financial Times',
    category: 'tariff',
    url: 'https://www.ft.com/'
  },
  {
    title: 'Nearshoring trends accelerate in manufacturing',
    source: 'Industry Week',
    category: 'trade',
    url: 'https://www.industryweek.com/'
  }
];

function inferCategory(title: string) {
  const normalized = title.toLowerCase();

  if (/tariff|trade policy|negotiat|duties/i.test(normalized)) {
    return 'tariff';
  }

  if (/ship|port|route|suez|panama|maritime|container|vessel|congestion/i.test(normalized)) {
    return 'shipping';
  }

  if (/supply chain|resilien|manufactur|inventory|logistics|warehouse/i.test(normalized)) {
    return 'supplychain';
  }

  return 'trade';
}

async function fetchTavilyHeadlines() {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (!tavilyApiKey) {
    console.warn('⚠️ Tavily API key not found; using fallback headlines');
    return defaultHeadlines;
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: 'latest global trade shipping tariffs supply chain disruptions news',
        search_depth: 'basic',
        max_results: 5,
        include_domains: [
          'reuters.com',
          'ft.com',
          'bloomberg.com',
          'wsj.com',
          'maritime-executive.com',
          'theloadstar.com',
          'shippingwatch.com'
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Tavily API error:', errorData);
      return defaultHeadlines;
    }

    const data = await response.json();
    const results = data.results || [];

    return results.slice(0, 5).map((item: unknown, index: number) => {
      const result = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const title = typeof result.title === 'string' ? result.title : `Trade update ${index + 1}`;
      const url = typeof result.url === 'string' ? result.url : '';
      return {
        title,
        source: typeof result.source === 'string' ? result.source : url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || 'Tavily',
        category: inferCategory(title),
        url: url || defaultHeadlines[index % defaultHeadlines.length].url,
      };
    });
  } catch (error) {
    console.error('❌ Tavily request failed:', error);
    return defaultHeadlines;
  }
}

export async function GET() {
  console.log('========================================');
  console.log('📡 [Trade News] Request started');
  console.log('========================================');

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const tavilyHeadlines = await fetchTavilyHeadlines();

  if (!geminiApiKey) {
    console.warn('⚠️ Gemini API key not found; using fallback metrics with Tavily headlines');
    return NextResponse.json({
      tariffIndex: 147.3,
      supplyChainIndex: 86.2,
      nearshoringIndex: 2340,
      chokepointRisk: 'MEDIUM',
      alertText: 'Global trade monitoring active - using AI fallback',
      headlines: tavilyHeadlines,
      summary: 'Global trade landscape showing mixed signals with ongoing adjustments to supply chains and trade policies.',
      keyRisks: ['Trade tensions', 'Supply chain disruptions', 'Geopolitical uncertainty'],
      opportunities: ['Nearshoring', 'Trade diversification', 'Digital trade'],
      lastUpdated: new Date().toISOString(),
      _debug: {
        source: 'fallback',
        tavilyUsed: tavilyHeadlines.length > 0
      }
    });
  }

  try {
    // Generate trade news summary using Gemini
    const prompt = `You are a global trade intelligence analyst. Provide a comprehensive update on global trade, tariffs, shipping routes, and supply chains.

Please format your response as a JSON object with the following structure:
{
  "tariffIndex": number (based on current tariff news sentiment, 100-200 scale),
  "supplyChainIndex": number (based on supply chain health, 50-150 scale),
  "nearshoringIndex": number (based on nearshoring trends, 1500-3000 scale),
  "chokepointRisk": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "alertText": "Brief alert about major trade disruption (max 60 chars)",
  "headlines": [
    {"title": "headline 1", "source": "source name", "category": "trade|shipping|tariff|supplychain"},
    {"title": "headline 2", "source": "source name", "category": "trade|shipping|tariff|supplychain"},
    {"title": "headline 3", "source": "source name", "category": "trade|shipping|tariff|supplychain"},
    {"title": "headline 4", "source": "source name", "category": "trade|shipping|tariff|supplychain"},
    {"title": "headline 5", "source": "source name", "category": "trade|shipping|tariff|supplychain"}
  ],
  "summary": "Brief 2-3 sentence summary of current global trade situation",
  "keyRisks": ["risk 1", "risk 2", "risk 3"],
  "opportunities": ["opportunity 1", "opportunity 2"]
}

Based on your knowledge of:
- Current tariff wars and trade disputes (US-China, US-EU, etc.)
- Shipping route disruptions (Red Sea, Suez Canal, Panama Canal)
- Supply chain shifts and nearshoring trends
- Manufacturing hub changes
- Geopolitical trade impacts

Use realistic current data and trends. Make it feel like a live intelligence update.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          responseMimeType: 'application/json',
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API Error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('✅ Gemini response received');
    console.log('📝 Response length:', text.length);

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsedData;
    
    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed Gemini response');
      } catch {
        console.error('❌ Failed to parse JSON, using fallback');
        parsedData = null;
      }
    }

    // If parsing fails, use fallback data with Gemini's text summary
    if (!parsedData) {
      console.log('Using fallback with Gemini summary');
      return NextResponse.json({
        tariffIndex: 145 + Math.floor(Math.random() * 20),
        supplyChainIndex: 85 + Math.floor(Math.random() * 15),
        nearshoringIndex: 2300 + Math.floor(Math.random() * 200),
        chokepointRisk: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
        alertText: 'Global trade monitoring active',
        headlines: tavilyHeadlines,
        summary: text.substring(0, 200) || 'Global trade landscape showing mixed signals with ongoing adjustments to supply chains and trade policies.',
        keyRisks: ['Trade tensions', 'Supply chain disruptions', 'Geopolitical uncertainty'],
        opportunities: ['Nearshoring', 'Trade diversification', 'Digital trade'],
        lastUpdated: new Date().toISOString(),
        _debug: { 
          rawResponse: text.substring(0, 500),
          source: 'gemini'
        }
      });
    }

    // Ensure we have the required fields
    const result = {
      tariffIndex: parsedData.tariffIndex || 147,
      supplyChainIndex: parsedData.supplyChainIndex || 86,
      nearshoringIndex: parsedData.nearshoringIndex || 2340,
      chokepointRisk: parsedData.chokepointRisk || 'MEDIUM',
      alertText: parsedData.alertText || 'Global trade monitoring active',
      headlines: (parsedData.headlines?.slice(0, 5) || tavilyHeadlines).map((item: unknown, index: number) => {
        const headline = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        return {
          ...headline,
          url: typeof headline.url === 'string' && headline.url
            ? headline.url
            : tavilyHeadlines[index]?.url || defaultHeadlines[index % defaultHeadlines.length].url,
        };
      }),
      summary: parsedData.summary || 'Global trade landscape showing mixed signals.',
      keyRisks: parsedData.keyRisks || ['Trade tensions', 'Supply chain disruptions'],
      opportunities: parsedData.opportunities || ['Nearshoring', 'Trade diversification'],
      lastUpdated: new Date().toISOString(),
      _debug: { 
        source: 'gemini',
        parsed: true
      }
    };

    console.log('✅ Final result:', {
      tariffIndex: result.tariffIndex,
      supplyChainIndex: result.supplyChainIndex,
      chokepointRisk: result.chokepointRisk,
      headlines: result.headlines.length
    });
    console.log('========================================');

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('========================================');

    // Return fallback data
    return NextResponse.json({
      tariffIndex: 147.3,
      supplyChainIndex: 86.2,
      nearshoringIndex: 2340,
      chokepointRisk: 'MEDIUM',
      alertText: 'Global trade monitoring active - using AI fallback',
      headlines: tavilyHeadlines,
      summary: 'Global trade landscape showing mixed signals with ongoing adjustments to supply chains and trade policies.',
      keyRisks: ['Trade tensions', 'Supply chain disruptions', 'Geopolitical uncertainty'],
      opportunities: ['Nearshoring', 'Trade diversification', 'Digital trade'],
      lastUpdated: new Date().toISOString(),
      _debug: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'fallback'
      }
    });
  }
}
