// Lightweight social listening scaffold: fetches public posts via configured APIs (stub if unavailable)
const axios = require('axios');

const sentimentLexicon = { good:1, great:2, love:2, amazing:3, bad:-1, terrible:-2, hate:-2 };

function scoreTextSentiment(text) {
  if (!text) return 0;
  const toks = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  let s = 0; for (const t of toks) if (sentimentLexicon[t]) s += sentimentLexicon[t];
  return s;
}

async function listen(keywords, opts={source:'x', limit:20}) {
  // Try to call provider API if configured; otherwise return stubbed items
  // This returns an array of { id, text, author, sentiment }
  if (!keywords || !keywords.length) return [];
  // stubbed results
  const items = [];
  for (let i=0;i<Math.min(10, opts.limit||10); i++) {
    const text = `${keywords[0]} mention sample ${i}`;
    items.push({ id: `stub_${i}`, text, author: `user${i}`, sentiment: scoreTextSentiment(text) });
  }
  return items;
}

async function analyzeCompetitors(handles) {
  // simple placeholder: counts mentions per handle in stub data
  const r = handles.map(h => ({ handle: h, mentions: Math.floor(Math.random()*100), sentiment: Math.round(Math.random()*5-2) }));
  return r;
}

module.exports = { listen, analyzeCompetitors, scoreTextSentiment };
