// Simple budget optimizer: scores channels by expected ROI and splits budget proportionally.
// This is a lightweight heuristic-based optimizer suitable as a starting point.

function safeAvg(arr) { if (!arr || !arr.length) return 0; return arr.reduce((s,v)=>s+v,0)/arr.length; }

// historicalData: { channel: { impressions:[], clicks:[], conversions:[], valuePerConversion: number } }
function scoreChannels(historicalData) {
  const scores = {};
  for (const ch of Object.keys(historicalData || {})) {
    const h = historicalData[ch] || {};
    const avgImpr = safeAvg(h.impressions || []);
    const avgClicks = safeAvg(h.clicks || []);
    const avgConv = safeAvg(h.conversions || []);
    const ctr = avgImpr > 0 ? (avgClicks / avgImpr) : 0;
    const convRate = avgClicks > 0 ? (avgConv / avgClicks) : 0;
    const value = h.valuePerConversion || 1;
    const expected = ctr * convRate * value;
    scores[ch] = { ctr, convRate, value, expected };
  }
  return scores;
}

function allocateBudget(channels, budget, historicalData) {
  const hist = historicalData || {};
  const scores = scoreChannels(hist);
  // fallback: equal split if no scores
  let total = 0;
  for (const ch of channels) total += (scores[ch] && scores[ch].expected) || 0;
  if (total <= 0) {
    const per = Math.round(budget / Math.max(1, channels.length));
    return channels.map(ch => ({ channel: ch, amount: per }));
  }
  const allocations = channels.map(ch => {
    const s = (scores[ch] && scores[ch].expected) || 0;
    const amt = Math.round((s / total) * budget);
    return { channel: ch, amount: amt };
  });
  // adjust rounding remainder
  const sum = allocations.reduce((a,b)=>a+b.amount,0);
  let rem = budget - sum;
  let i = 0;
  while (rem > 0) { allocations[i % allocations.length].amount += 1; rem--; i++; }
  return allocations;
}

module.exports = { scoreChannels, allocateBudget };
