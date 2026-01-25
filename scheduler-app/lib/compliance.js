// Simple compliance checks: banned words, copyright/trademark heuristics, NSFW stub

const bannedWords = ['illegal','bannedword'];
const trademarkPatterns = [/\bTM\b/, /\bRegistered\b/i];

function scanText(text) {
  const issues = [];
  if (!text) return { ok: true, issues };
  const lower = text.toLowerCase();
  for (const b of bannedWords) if (lower.includes(b)) issues.push({ type: 'banned_word', match: b });
  for (const p of trademarkPatterns) if (p.test(text)) issues.push({ type: 'trademark_like', pattern: p.toString() });
  // simple copyright mention
  if (/©|copyright/i.test(text)) issues.push({ type: 'copyright_mention' });
  return { ok: issues.length === 0, issues };
}

async function scanImage(url) {
  // Placeholder: in production call an image safety API or NSFW classifier
  if (!url) return { ok: true };
  if (url.includes('nsfw')) return { ok: false, issues: [{ type: 'nsfw', confidence: 0.9 }] };
  return { ok: true };
}

module.exports = { scanText, scanImage };
