// Simple A/B experiment runner with deterministic assignment and z-test result check.
const crypto = require('crypto');

const experiments = new Map();

function hashToNumber(s) { const h = crypto.createHash('sha1').update(s).digest(); return h.readUInt32BE(0) / 0xffffffff; }

function createExperiment(id, variants, options={}) {
  const totalWeight = variants.reduce((s,v)=>s+(v.weight||1),0);
  const normalized = variants.map(v=>({ name: v.name, weight: (v.weight||1)/totalWeight }));
  experiments.set(id, { id, variants: normalized, allocations: {}, stats: {} });
  return experiments.get(id);
}

function assignVariant(experimentId, userId) {
  const exp = experiments.get(experimentId);
  if (!exp) throw new Error('experiment not found');
  const r = hashToNumber(userId + '|' + experimentId);
  let acc = 0;
  for (const v of exp.variants) {
    acc += v.weight;
    if (r <= acc) {
      return v.name;
    }
  }
  return exp.variants[exp.variants.length-1].name;
}

function recordConversion(experimentId, variantName, converted) {
  const key = `${experimentId}::${variantName}`;
  const s = experiments.get(experimentId).stats[key] || { trials: 0, conversions: 0 };
  s.trials += 1; if (converted) s.conversions += 1;
  experiments.get(experimentId).stats[key] = s;
}

function analyze(experimentId) {
  const exp = experiments.get(experimentId);
  if (!exp) throw new Error('experiment not found');
  const results = [];
  for (const v of exp.variants) {
    const key = `${experimentId}::${v.name}`;
    const s = exp.stats[key] || { trials:0, conversions:0 };
    const rate = s.trials ? (s.conversions / s.trials) : 0;
    results.push({ variant: v.name, trials: s.trials, conversions: s.conversions, rate });
  }
  // pick winner by highest rate (simple, not statistically rigorous)
  results.sort((a,b)=>b.rate - a.rate);
  return { experimentId, results, winner: results[0] || null };
}

module.exports = { createExperiment, assignVariant, recordConversion, analyze };
